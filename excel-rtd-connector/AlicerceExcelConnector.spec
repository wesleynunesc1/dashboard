# -*- mode: python ; coding: utf-8 -*-
import os
import customtkinter

block_cipher = None

# Localiza arquivos e temas do customtkinter
ctk_dir = os.path.dirname(customtkinter.__file__)

datas = [
    (os.path.join(ctk_dir), 'customtkinter'),
    ('config/settings.example.json', 'config'),
    ('config/settings.json', 'config'),
]

a = Analysis(
    ['main.py'],
    pathex=['.'],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'win32timezone',
        'pystray',
        'PIL',
        'customtkinter',
        'pydantic',
        'pydantic_core',
        'rich',
        'psutil'
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['matplotlib', 'scipy', 'numpy', 'pandas', 'openpyxl'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='AlicerceExcelConnector',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False, # Modo silencioso sem janela de prompt preta
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='AlicerceExcelConnector',
)
