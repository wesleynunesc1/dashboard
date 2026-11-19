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


class CellMappingItem(BaseModel):
    """Mapeamento declarativo de uma célula ou intervalo específico."""
    indicator: str                 # Identificador na Dashboard (ex: wdofut_price, winz_price)
    address: str                   # Coordenada da célula (ex: D12, D34, D2)
    data_type: str = "float"       # float, int, str, range
    frequency_ms: Optional[int] = None # Opcional: frequência específica de leitura


class WorksheetMapping(BaseModel):
    """Mapeamento de uma aba em uma pasta de trabalho."""
    sheet_name: str
    cells: List[CellMappingItem] = Field(default_factory=list)
    ranges: Dict[str, str] = Field(default_factory=dict)


class WorkbookSource(BaseModel):
    """Definição de uma pasta de trabalho a ser monitorada simultaneamente."""
    name_pattern: str              # Padrão ou nome exato do arquivo (ex: DADOS^JWIN^JWDO, nero.xlsm)
    sheets: List[WorksheetMapping] = Field(default_factory=list)
    polling_interval_ms: int = 250
    active: bool = True


class ConnectorSettings(BaseModel):
    """Configuração validada do conector multi-planilha."""
    # Compatibilidade com configuração legado (single workbook)
    workbook: str = ""
    worksheet: str = ""
    cells: Dict[str, str] = Field(default_factory=dict)
    ranges: Dict[str, str] = Field(default_factory=dict)

    # Nova arquitetura multi-planilhas simultâneas
    workbooks: List[WorkbookSource] = Field(default_factory=list)

    polling_interval_ms: int = 250
    server_url: str = "wss://dashboard-production-7b535f43.up.railway.app"
    server_token: str = "alicerce_rtd_secret_token_2026"
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
