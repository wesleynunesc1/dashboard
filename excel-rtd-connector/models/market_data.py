# excel-rtd-connector/models/market_data.py
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class CellValue(BaseModel):
    """Representa um valor normalizado de célula ou matriz de intervalo."""
    address: str
    key: str
    raw_value: Any = None
    normalized_value: Any = None
    is_error: bool = False
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


class FieldChange(BaseModel):
    """Representa a alteração detectada em um campo."""
    key: str
    address: str
    previous_value: Any = None
    current_value: Any = None
    delta: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    duration_ms: float = 0.0


class ConnectorSettings(BaseModel):
    """Configuração validada do conector."""
    workbook: str = ""
    worksheet: str = ""
    polling_interval_ms: int = 250
    server_url: str = "ws://localhost:8080"
    server_token: str = "alicerce_rtd_secret_token_2026"
    cells: Dict[str, str] = Field(default_factory=dict)
    ranges: Dict[str, str] = Field(default_factory=dict)
    tolerance: float = 1e-6
    max_consecutive_errors: int = 5
    log_level: str = "INFO"


class ExcelInstanceInfo(BaseModel):
    """Metadados de uma instância detectada do Excel."""
    process_id: Optional[int] = None
    workbooks_count: int = 0
    workbooks: List[str] = Field(default_factory=list)
    version: Optional[str] = None
    caption: Optional[str] = None
