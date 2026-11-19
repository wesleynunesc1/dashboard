# excel-rtd-connector/connector/cell_reader.py
"""
Módulo de leitura segura de células e intervalos via COM.
Usa estritamente Range.Value2 para ler o valor calculado em memória pelo RTD.
Não lê fórmulas, não aciona cálculo e não executa escrita.
"""
import logging
from typing import Dict, Any, Tuple
from datetime import datetime
from models.market_data import CellValue

logger = logging.getLogger("excel_connector.reader")

# Mapeamento de códigos de erro típicos do Excel em COM
EXCEL_ERROR_CODES = {
    -2146826281: "#DIV/0!",
    -2146826246: "#N/A",
    -2146826259: "#NAME?",
    -2146826288: "#NULL!",
    -2146826252: "#NUM!",
    -2146826273: "#REF!",
    -2146826287: "#VALUE!",
}


class CellReader:
    """Realiza leituras em memória usando Value2 e normaliza tipos de dados."""

    @staticmethod
    def normalize_value(raw: Any) -> Tuple[Any, bool, str | None]:
        """
        Normaliza o retorno COM:
        - Detecta erros numéricos COM do Excel (#N/A, #VALUE!)
        - Preserva floats e ints com precisão total
        - Distingue None (vazio) de 0.0
        """
        if raw is None:
            return None, False, None

        # Erros COM do Excel geralmente chegam como inteiros negativos grandes
        if isinstance(raw, int) and raw in EXCEL_ERROR_CODES:
            return None, True, EXCEL_ERROR_CODES[raw]

        if isinstance(raw, str):
            cleaned = raw.strip()
            if cleaned.startswith("#") and cleaned.endswith("!"):
                return None, True, cleaned
            return cleaned, False, None

        if isinstance(raw, (int, float, bool)):
            return raw, False, None

        # Datas COM
        if isinstance(raw, datetime):
            return raw.isoformat(), False, None

        return str(raw), False, None

    @classmethod
    def read_mapped_cells(
        cls,
        worksheet_com: Any,
        cells_map: Dict[str, str],
        ranges_map: Dict[str, str] = None
    ) -> Dict[str, CellValue]:
        """
        Lê todas as células configuradas em uma única passagem sequencial.
        """
        results: Dict[str, CellValue] = {}
        ranges_map = ranges_map or {}

        # 1. Leitura de células individuais
        for key, address in cells_map.items():
            try:
                # Value2 lê o valor real numérico sem formatação e sem recálculo
                raw = worksheet_com.Range(address).Value2
                normalized, is_err, err_code = cls.normalize_value(raw)
                results[key] = CellValue(
                    key=key,
                    address=address,
                    raw_value=raw,
                    normalized_value=normalized,
                    is_error=is_err,
                    error_code=err_code,
                    timestamp=datetime.now()
                )
            except Exception as e:
                logger.debug(f"Falha ao ler célula {address} ({key}): {e}")
                results[key] = CellValue(
                    key=key,
                    address=address,
                    raw_value=None,
                    normalized_value=None,
                    is_error=True,
                    error_code=str(e),
                    timestamp=datetime.now()
                )

        # 2. Leitura de intervalos contínuos em lote (batch reading)
        for range_key, range_address in ranges_map.items():
            try:
                raw_matrix = worksheet_com.Range(range_address).Value2
                results[range_key] = CellValue(
                    key=range_key,
                    address=range_address,
                    raw_value=raw_matrix,
                    normalized_value=raw_matrix,
                    is_error=False,
                    error_code=None,
                    timestamp=datetime.now()
                )
            except Exception as e:
                logger.debug(f"Falha ao ler intervalo {range_address} ({range_key}): {e}")
                results[range_key] = CellValue(
                    key=range_key,
                    address=range_address,
                    raw_value=None,
                    normalized_value=None,
                    is_error=True,
                    error_code=str(e),
                    timestamp=datetime.now()
                )

        return results
