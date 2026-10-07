import unittest
from unittest.mock import patch

from starlette.testclient import TestClient

from app.api import create_app


class ApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client = TestClient(create_app())

    def test_health_and_openapi_are_available(self) -> None:
        health = self.client.get("/health")
        openapi = self.client.get("/openapi.json")

        self.assertEqual(health.status_code, 200)
        self.assertEqual(health.json()["status"], "ok")
        self.assertEqual(openapi.status_code, 200)
        self.assertIn("/api/v1/inferences", openapi.json()["paths"])
        self.assertIn("/api/v1/inferences/history/{record_date}", openapi.json()["paths"])

    def test_model_endpoint_exposes_the_audited_configuration(self) -> None:
        response = self.client.get("/api/v1/model")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["version"], "1.1.0")
        self.assertEqual(body["tipo"], "mamdani")
        self.assertEqual(body["total_reglas"], 192)
        self.assertEqual(len(body["entradas"]), 4)
        self.assertEqual(body["operadores"]["defuzzificacion"], "centroid")

    def test_rules_endpoint_exposes_the_same_complete_knowledge_base(self) -> None:
        response = self.client.get("/api/v1/rules")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["model_version"], "1.1.0")
        self.assertEqual(body["total_reglas"], 192)
        self.assertEqual(len(body["reglas"]), 192)
        self.assertEqual(
            [rule["numero"] for rule in body["reglas"]], list(range(1, 193))
        )
        self.assertEqual(len({
            tuple(rule["antecedentes"].items()) for rule in body["reglas"]
        }), 192)
        self.assertEqual(
            set(body["reglas"][0]["antecedentes"]),
            {
                "humedad_suelo_superficial_m3m3",
                "viento_max_ms",
                "hr_min_pct",
                "dias_secos",
            },
        )

    def test_history_endpoints_expose_range_and_daily_record(self) -> None:
        range_response = self.client.get("/api/v1/history/range")
        record_response = self.client.get("/api/v1/history/2000-01-01")

        self.assertEqual(range_response.status_code, 200)
        self.assertEqual(
            range_response.json(),
            {
                "fecha_inicial": "2000-01-01",
                "fecha_final": "2025-12-31",
                "total_registros": 9497,
                "frecuencia": "diaria",
                "zona_horaria": "America/Lima",
            },
        )
        self.assertEqual(record_response.status_code, 200)
        record = record_response.json()
        self.assertEqual(record["fecha"], "2000-01-01")
        self.assertEqual(record["pp_mm"], 8.2)
        self.assertEqual(record["dias_secos"], 0)

    def test_manual_inference_returns_explanation_and_curve(self) -> None:
        response = self.client.post(
            "/api/v1/inferences",
            json={
                "hr_min_pct": 30,
                "dias_secos": 8,
                "viento_max_ms": 4.5,
                "humedad_suelo_superficial_m3m3": 0.354,
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["model_version"], "1.1.0")
        self.assertEqual(body["modo"], "manual")
        self.assertEqual(body["resultado"]["codigo_categoria"], "muy_alto")
        self.assertAlmostEqual(body["resultado"]["indice"], 275.0 / 3.0, delta=0.08)
        self.assertEqual(body["fuente"], {"tipo": "manual"})
        self.assertTrue(body["reglas_activas"])
        self.assertEqual(len(body["curva_salida"]), 2001)

    def test_historical_inference_includes_traceability_and_season(self) -> None:
        response = self.client.get("/api/v1/inferences/history/2000-06-01")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["modo"], "historical")
        self.assertEqual(body["fuente"]["fecha"], "2000-06-01")
        self.assertEqual(
            body["fuente"]["dataset"], "weather_inputs_2000_2025.csv"
        )
        self.assertTrue(body["fuente"]["dentro_periodo_calibracion"])
        self.assertEqual(
            body["entradas"]["hr_min_pct"],
            body["fuente"]["registro"]["hr_min_pct"],
        )

    def test_response_rounds_floats_without_changing_the_model_result(self) -> None:
        response = self.client.post(
            "/api/v1/inferences",
            json={
                "hr_min_pct": 53,
                "dias_secos": 2,
                "viento_max_ms": 2.45,
                "humedad_suelo_superficial_m3m3": 0.354,
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["resultado"]["indice"], 50.0)
        self.assertEqual(
            body["pertenencias_salida"],
            {
                "muy_bajo": 0.0,
                "bajo": 0.0,
                "moderado": 1.0,
                "alto": 0.0,
                "muy_alto": 0.0,
            },
        )
        self.assertEqual(body["resultado"]["codigo_categoria"], "moderado")
        self.assertEqual(len(body["curva_salida"]), 2001)

    def test_four_reference_levels_return_the_expected_api_result(self) -> None:
        scenarios = (
            (
                {
                    "hr_min_pct": 85,
                    "dias_secos": 0,
                    "viento_max_ms": 1.5,
                    "humedad_suelo_superficial_m3m3": 0.354,
                },
                8.33,
                "muy_bajo",
                "Muy bajo",
            ),
            (
                {
                    "hr_min_pct": 85,
                    "dias_secos": 8,
                    "viento_max_ms": 1.5,
                    "humedad_suelo_superficial_m3m3": 0.354,
                },
                50.0,
                "moderado",
                "Moderado",
            ),
            (
                {
                    "hr_min_pct": 30,
                    "dias_secos": 0,
                    "viento_max_ms": 4.5,
                    "humedad_suelo_superficial_m3m3": 0.354,
                },
                75.0,
                "alto",
                "Alto",
            ),
            (
                {
                    "hr_min_pct": 30,
                    "dias_secos": 8,
                    "viento_max_ms": 4.5,
                    "humedad_suelo_superficial_m3m3": 0.354,
                },
                91.67,
                "muy_alto",
                "Muy alto",
            ),
        )

        for payload, expected_index, expected_code, expected_label in scenarios:
            with self.subTest(expected_code=expected_code):
                response = self.client.post("/api/v1/inferences", json=payload)
                self.assertEqual(response.status_code, 200)
                result = response.json()["resultado"]
                self.assertEqual(result["indice"], expected_index)
                self.assertEqual(result["codigo_categoria"], expected_code)
                self.assertEqual(result["categoria"], expected_label)

    def test_invalid_requests_use_the_stable_error_envelope(self) -> None:
        invalid_payloads = (
            {
                "hr_min_pct": 30,
                "dias_secos": 8,
                "viento_max_ms": 6.1,
                "humedad_suelo_superficial_m3m3": 0.354,
            },
            {
                "hr_min_pct": 30,
                "dias_secos": 8,
                "viento_max_ms": 4.5,
            },
            {
                "hr_min_pct": 30,
                "dias_secos": 8,
                "viento_max_ms": 4.5,
                "humedad_suelo_superficial_m3m3": 0.354,
                "desconocido": 10,
            },
        )
        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.client.post("/api/v1/inferences", json=payload)
                self.assertEqual(response.status_code, 422)
                self.assertEqual(response.json()["error"]["code"], "VALIDATION_ERROR")
                self.assertTrue(response.json()["error"]["details"])

    def test_missing_and_malformed_historical_dates_have_distinct_errors(self) -> None:
        missing = self.client.get("/api/v1/history/1999-12-31")
        malformed = self.client.get("/api/v1/history/no-es-fecha")

        self.assertEqual(missing.status_code, 404)
        self.assertEqual(
            missing.json()["error"]["code"], "HISTORICAL_DATE_NOT_FOUND"
        )
        self.assertEqual(malformed.status_code, 422)
        self.assertEqual(malformed.json()["error"]["code"], "VALIDATION_ERROR")

    def test_cors_allows_the_local_frontend(self) -> None:
        response = self.client.options(
            "/api/v1/inferences",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"], "http://localhost:5173"
        )

    def test_cors_allows_origins_configured_for_deployment(self) -> None:
        production_origin = "https://sistema-difuso-g8-web.onrender.com"
        with patch.dict("os.environ", {"CORS_ORIGINS": production_origin}):
            client = TestClient(create_app())
            response = client.options(
                "/api/v1/inferences",
                headers={
                    "Origin": production_origin,
                    "Access-Control-Request-Method": "POST",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers["access-control-allow-origin"], production_origin
        )


if __name__ == "__main__":
    unittest.main()
