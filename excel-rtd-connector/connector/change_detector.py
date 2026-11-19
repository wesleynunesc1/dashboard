# excel-rtd-connector/connector/change_detector.py
"""
Módulo de detecção de alterações (Delta Engine).
Compara o estado anterior com o atual, respeitando tolerância numérica
e identificando com precisão os campos modificados.
"""
from typing import Dict, List, Optional
import math
from models.market_data import CellValue, FieldChange


class ChangeDetector:
    """Compara snapshots subsequentes e extrai deltas com precisão."""

    def __init__(self, tolerance: float = 1e-6):
        self.tolerance = tolerance
        self._last_state: Dict[str, CellValue] = {}

    def get_last_state(self) -> Dict[str, CellValue]:
        return self._last_state

    def reset(self) -> None:
        self._last_state.clear()

    def detect_changes(
        self,
        current_state: Dict[str, CellValue],
        duration_ms: float = 0.0
    ) -> List[FieldChange]:
        """
        Compara o estado atual com o anterior.
        Na primeira execução, armazena o estado e não gera alterações artificiais.
        """
        changes: List[FieldChange] = []

        if not self._last_state:
            self._last_state = current_state.copy()
            return changes

        for key, curr_cell in current_state.items():
            prev_cell = self._last_state.get(key)
            if not prev_cell:
                # Novo campo mapeado durante a execução
                changes.append(FieldChange(
                    key=key,
                    address=curr_cell.address,
                    previous_value=None,
                    current_value=curr_cell.normalized_value,
                    delta=None,
                    duration_ms=duration_ms
                ))
                continue

            prev_val = prev_cell.normalized_value
            curr_val = curr_cell.normalized_value

            # Tratamento de erro vs valor válido
            if prev_cell.is_error != curr_cell.is_error:
                changes.append(FieldChange(
                    key=key,
                    address=curr_cell.address,
                    previous_value=prev_cell.error_code if prev_cell.is_error else prev_val,
                    current_value=curr_cell.error_code if curr_cell.is_error else curr_val,
                    delta=None,
                    duration_ms=duration_ms
                ))
                continue

            if curr_cell.is_error:
                # Ambos em erro, se o código mudou reporta
                if prev_cell.error_code != curr_cell.error_code:
                    changes.append(FieldChange(
                        key=key,
                        address=curr_cell.address,
                        previous_value=prev_cell.error_code,
                        current_value=curr_cell.error_code,
                        delta=None,
                        duration_ms=duration_ms
                    ))
                continue

            # Comparação numérica com tolerância
            if isinstance(prev_val, (int, float)) and isinstance(curr_val, (int, float)):
                diff = curr_val - prev_val
                if abs(diff) > self.tolerance:
                    changes.append(FieldChange(
                        key=key,
                        address=curr_cell.address,
                        previous_value=prev_val,
                        current_value=curr_val,
                        delta=round(diff, 6),
                        duration_ms=duration_ms
                    ))
            elif prev_val != curr_val:
                # String, boolean ou matriz de intervalo
                changes.append(FieldChange(
                    key=key,
                    address=curr_cell.address,
                    previous_value=prev_val,
                    current_value=curr_val,
                    delta=None,
                    duration_ms=duration_ms
                ))

        # Atualiza o último estado conhecido
        self._last_state = current_state.copy()
        return changes
