---
name: abap-MCB
description: Este skill permite a los agentes IA entender la arquitectura, los objetos ABAP y el modelo de datos del proyecto **MCB (Meli Central Buying)** implementado en SAP S/4HANA (sistema DS4, cliente 200).
---

# MCB (Meli Central Buying) — ABAP Backend Skill

## Propósito de este skill

Este skill permite a los agentes IA entender la arquitectura, los objetos ABAP y el modelo de datos del proyecto **MCB (Meli Central Buying)** implementado en SAP S/4HANA (sistema DS4, cliente 200). El proyecto MCB digitaliza y gestiona el proceso de compras corporativas de MercadoLibre, desde la solicitud de pedido hasta la generación de OC/Contratos, incluyendo workflow de aprobaciones, SLA, notificaciones y lista de precios.

---

## Estructura de paquetes

| Paquete | Descripción | Contenido principal |
|---|---|---|
| `ZMM_MCB_01` | Desarrollos MCB — core | Price List, Process Flow, SLA Log, Flujo de Formularios |
| `ZP2P-MCB_COMPRADORES` | Desarrollo Compradores | Objetos de la vista del comprador (P2P) |
| `ZP2P-MCB_FINOPS` | Desarrollo Finops PTP | Objetos Finops para el proceso P2P |
| `ZP2P-MCB_SOLICITANTES` | Desarrollo Solicitantes PTP | Objetos para la vista del solicitante |
| `ZMM_SOLICITUD_PEDIDO` | Solicitudes de pedido en Fiori | Framework completo de formularios/SOLPED |

---

## Módulos funcionales

El proyecto MCB tiene dos grandes dominios funcionales:

### 1. Solicitud de Pedidos / Forms (`ZMM_SOLICITUD_PEDIDO`)

Framework para que solicitantes generen formularios de compra que atraviesan un flujo de aprobación multi-nivel (workflow), generan solicitudes de pedido SAP (SOLPED) y eventualmente órdenes de compra (OC) o contratos. Integra notificaciones por email, adjuntos DMS, integración con Workday y validaciones de carrito.

**Subprocesos:**
- Creación y edición de formularios de solicitud
- Workflow de aprobación (hasta 6 niveles: `approverN1..N6`)
- Generación de SOLPED SAP (`ZBP_GENERATE_SOLPEDS_001`)
- Generación de Bookings (`ZBP_GENERATE_BOOKINGS_001`)
- Asignación a compradores
- Modificación de OC / Contratos (`ZCL_FORM_ADJ_OC`, `ZCL_FORM_ADJ_CONT`)
- Notificaciones por mail (Smart Templates: `ZFORM_MAIL_USR_NOTIF`, `ZFORM_WF_BR_APPROVER`, `ZFORM_WF_BR_REJECTION`)
- Adjuntos DMS (`ZCL_E_FORM_QI_ATTACHMENTS_DMS`)
- Integración Workday (`ZFGR_WORKDAY_UTILITIES`)

**Tipos de solicitud:** Contrato Nuevo (`CC`), Modificación de Contrato (`MC`), Orden de Compra (otros)

### 2. Price List / Lista de Precios (`ZMM_MCB_01`)

Gestión de listas de precios por proveedor/material/centro, cargadas desde archivos (Excel/CSV), con workflow propio y almacenamiento temporal antes de confirmar. Usa RAP (RESTful Application Programming Model) con OData V4.

### 3. Process Flow / Flujo de Compra (`ZMM_MCB_01`)

Visualización tipo proceso (SAP Fiori Process Flow) del ciclo completo de un formulario: Contrato Marco → Formulario → OC → Recepciones → Facturas → Pagos.

### 4. SLA Log Timeline (`ZMM_MCB_01`)

Visualización de timeline (SAP Fiori Timeline) con el historial de estados SLA de un formulario: cuándo entró/salió de cada estado, tiempos de permanencia.

---

## Modelo de datos — Tablas principales

### Tablas de formularios (proceso SOLPED/Forms)

| Tabla | Descripción |
|---|---|
| `ZTMM_FORMS` | Cabecera del formulario: `idformulario`, `version`, `doccompra` (OC/SOLPED), `tiposolicitud`, `tipoproceso`, `estado`, `usuario`, `responsable_compras`, `lastchangedat` |
| `ZTMM_FORMITEMS` | Posiciones del formulario: material, cantidad, unidad, `contratomarco`, `categoriaoc`, proveedor, centro, CeCo, imputación |
| `ZTMM_FORMIMPS` | Imputaciones de costo por posición (CeCo, orden, cuenta mayor) |
| `ZTMM_FORMLOG` | Log de cambios de estado del formulario |
| `ZTMM_FORM_ATT` | Adjuntos del formulario |
| `ZTMM_FORM_COMM` | Comentarios del formulario |
| `ZTMM_FORM_COMATT` | Adjuntos de comentarios |
| `ZTMM_FORM_WF_BR` | Configuración de reglas de workflow (Business Rules) |
| `ZTMM_APRO_WF_BR` | Aprobadores por regla de workflow |
| `ZTMM_ASIGN_SOLP` | Asignación de solicitudes a compradores |
| `ZTMM_FORM_ASSIGN` | Asignaciones generales de formularios |
| `ZTMM_RESP_FORMS` | Responsables de formularios |
| `ZTMM_SOLPEDS` | Solicitudes de pedido SAP vinculadas |
| `ZTMM_ITEMSOLPEDS` | Posiciones de SOLPED |
| `ZTMM_IMPSOLPEDS` | Imputaciones de SOLPED |
| `ZTBOOKING_001` | Bookings generados |
| `ZTMM_IMG_SOLPED` | Imágenes de SOLPED |
| `ZTMM_SOLPED_ATT` | Adjuntos de SOLPED |
| `ZTMM_SOLPED_COMM` | Comentarios de SOLPED |
| `ZTMM_CONTR_EDITO` | Contratos — editores |
| `ZTMM_CONTR_SOLIC` | Contratos — solicitantes |

### Tablas de configuración

| Tabla | Descripción |
|---|---|
| `ZTMM_CONFIG_F01..F10` | Configuración parametrizable por tipo de formulario (F01..F10) |
| `ZMMT_RESP_FORMS` | Responsables de formularios (maestro) |
| `ZMMT_ASIG_FORMS` | Asignaciones de formularios (maestro) |

### Tablas de Price List

| Tabla | Descripción |
|---|---|
| `ZTMM_PL_HEADER` / `ZTMM_PL_HEADERTM` | Cabecera de lista de precios: `uuid`, `buzei` (item), `lifnr` (proveedor), `werks` (centro), `filename`, `pais`, `comprador`, `pic_nro` |
| `ZTMM_PL_ITEMSTMP` | Items temporales de lista de precios: material, precios (`kbet1`, `kbet2`), moneda, validez (`datab`, `datbi`), lead time, URL imagen |

### Rango de numeración

| Objeto | Descripción |
|---|---|
| `ZMCB_FORMS` | Numerador de IDs de formulario MCB (`zemmidformulario`) |
| `ZMCB_K_PUO` | Numerador para Price List |

---

## CDS Views

### Price List — Capa de interfaz (ZMM_MCB_01)

| CDS | Tipo | Descripción |
|---|---|---|
| `ZI_MCB_PL_APP` | Root view entity | App base Price List; selecciona de `ztmm_pl_header`; composition con `ZI_MCB_PL_HEADER` |
| `ZI_MCB_PL_HEADER` | View entity | Cabecera de PL (`ztmm_pl_headertm`); composition con `ZI_MCB_PL_ITEM` |
| `ZI_MCB_PL_ITEM` | View entity | Items de PL (`ztmm_pl_itemstmp`); expone precios, validez, lead time, URL imagen |
| `ZI_MCB_PL_CHECK_HEADER` | View entity | Validaciones de cabecera PL |
| `ZI_MCB_PL_CHECK_ITEMS` | View entity | Validaciones de items PL |
| `ZI_MCB_PL_RESP_BUYER_UNIQUE` | View entity | Validación unicidad comprador-responsable |
| `ZI_MCB_PROVEEDOR` | View entity | VH de proveedores MCB |

### Price List — Capa de consumo (ZMM_MCB_01)

| CDS | Tipo | Descripción |
|---|---|---|
| `ZC_MCB_PL_APP` | Root consumption view | Vista de consumo para app PL (Fiori Elements) |
| `ZC_MCB_PL_HEADER` | Consumption view | Cabecera consumo |
| `ZC_MCB_PL_ITEM` | Consumption view | Items consumo |
| `ZC_MCB_PL_SUBMIT` | Consumption view | Acción de submit de PL |
| `ZC_MCB_PL_EXTENDER` | Consumption view | Extensión de PL |
| `ZC_MCB_PL_CHECK_HEADER` | Consumption view | Validación cabecera (consumo) |
| `ZC_MCB_PL_CHECK_ITEMS` | Consumption view | Validación items (consumo) |

### Flujo de Formularios — Custom Entity (ZMM_MCB_01)

| CDS | Tipo | Descripción |
|---|---|---|
| `ZCDS_MCB_FLUJO_FORMULARIOS` | Root custom entity | Vista maestra del flujo de compra; implementada por `ZCL_MCB_FLUJO_COMPRA_DET`; campos clave: `idformulario`, `doccompra`, `tiposolicitud`, `tipoproceso`, `estado`, `responsable_compras`, `proveedor`, `contratomarco`, aprobadores N1..N6 con fechas, historial de documentos, valores netos |

### Process Flow (ZMM_MCB_01)

| CDS | Tipo | Descripción |
|---|---|---|
| `ZCDS_MCB_C_PF_HEADER` | Root custom entity | Header del Process Flow; implementada por `ZCL_MCB_PF_CONTROLLER`; composition con `ZCDS_MCB_C_PF_LANES` |
| `ZCDS_MCB_C_PF_LANES` | Custom entity | Lanes del Process Flow (Contrato Marco, Formulario, OC, Recepciones, Facturas, Pagos) |
| `ZCDS_MCB_C_PF_NODES` | Custom entity | Nodos del Process Flow (documentos individuales dentro de cada lane) |

### SLA Log Timeline (ZMM_MCB_01)

| CDS | Tipo | Descripción |
|---|---|---|
| `ZCDS_MCB_C_TL_LOG_SLA_H` | Root custom entity | Header del Timeline SLA; implementada por `ZCL_MCB_TL_LOG_SLA_CONTROLLER`; composition con `ZCDS_MCB_C_TL_LOG_SLA_L` |
| `ZCDS_MCB_C_TL_LOG_SLA_L` | Custom entity | Lanes del Timeline SLA |
| `ZCDS_MCB_C_TL_LOG_SLA_N` | Custom entity | Nodos del Timeline SLA |
| `ZCDS_MCB_C_FORM_LOG_H` | Custom entity | Log de formulario (cabecera) |
| `ZCDS_MCB_I_FORM_LOG_H` | Interface CDS | Interfaz de log de formulario |
| `ZCDS_MCB_C_LOG_SLA_NODO` | Custom entity | Nodo del log SLA |

### Forms/SOLPED (ZMM_SOLICITUD_PEDIDO)

Las vistas del módulo Forms siguen el prefijo `ZFORM_CDS_I_` (interfaz) y `ZFORM_CDS_C_` (consumo):

| CDS | Descripción |
|---|---|
| `ZFORM_CDS_I_HEADER` / `ZFORM_CDS_C_HEADER` | Cabecera del formulario (root) |
| `ZFORM_CDS_I_ITEMS` / `ZFORM_CDS_C_ITEMS` | Items/posiciones |
| `ZFORM_CDS_I_CONTRATO` / `ZFORM_CDS_C_CONTRATO` | Datos de contrato |
| `ZFORM_CDS_I_OC` / `ZFORM_CDS_C_OC` | Orden de Compra vinculada |
| `ZFORM_CDS_I_COMMENTS` / `ZFORM_CDS_C_COMMENTS` | Comentarios |
| `ZFORM_CDS_I_HISTORIAL` / `ZFORM_CDS_C_REVISIONES` | Historial y revisiones |
| `ZFORM_CDS_I_IMPSOLPED` / `ZFORM_CDS_C_IMPSOLPED` | Imputaciones SOLPED |
| `ZFORM_CDS_C_ATTACHMENTS` / `ZFORM_CDS_C_ATTACHMENTS_DMS` | Adjuntos y adjuntos DMS |
| `ZFORM_CDS_I_VALIDACART` / `ZFORM_ADD_INPVALIDACART` | Validación de carrito |
| `ZFORM_CDS_I_CONTRATOMARCO` | Contrato marco |
| `ZI_SOLPED_001` / `ZI_SOLPED_002` | Solicitudes de pedido SAP (RAP) |
| `ZI_BOOKING_001` | Bookings |
| `ZI_ASIGN_SOLPED` | Asignación de SOLPED |
| `ZC_MISFORMS` / `ZC_MISFORMSIMPS` / `ZC_MISFORMSITEMS` | Vistas de consumo "Mis Formularios" |

---

## Clases ABAP

### Clases core del módulo Forms

| Clase | Paquete | Descripción |
|---|---|---|
| `ZCL_FORM_SOLPED_HANDLER` | `ZMM_SOLICITUD_PEDIDO` | Handler principal del formulario (orquestador del proceso) |
| `ZCL_DB_FORM_SOLPEDS` | `ZMM_SOLICITUD_PEDIDO` | Acceso a datos SOLPED (capa de persistencia) |
| `ZCL_DB_FORM_LOG` | `ZMM_SOLICITUD_PEDIDO` | Gestión del log del formulario |
| `ZCL_DB_FORM_ATT` | `ZMM_SOLICITUD_PEDIDO` | Gestión de adjuntos del formulario |
| `ZCL_DB_APRO_WF_BR` | `ZMM_SOLICITUD_PEDIDO` | Aprobadores por reglas de workflow |
| `ZCX_FORM_SOLPED` | `ZMM_SOLICITUD_PEDIDO` | Clase de excepción para el módulo Forms |

### Behavior Providers (RAP)

| Clase | Descripción |
|---|---|
| `ZBP_FORM_CDS_I_HEADER` | Behavior Provider del formulario (cabecera RAP) |
| `ZBP_I_SOLPED_001` | Behavior Provider de SOLPED |
| `ZBP_GENERATE_SOLPEDS_001` | Genera las SOLPED SAP desde el formulario |
| `ZBP_GENERATE_BOOKINGS_001` | Genera Bookings desde el formulario |

### Clases de eventos/side effects

| Clase | Descripción |
|---|---|
| `ZCL_E_FORM_SLA` | Gestión de SLA (cálculo, registro) |
| `ZCL_E_FORM_SLA_AGENT` | Agente SLA |
| `ZCL_E_FORM_SLA_USER` | Usuario SLA |
| `ZCL_E_FORM_WF_BR` | Workflow Business Rules |
| `ZCL_E_FORM_WF_NOTIFICATION` | Notificaciones del workflow |
| `ZCL_E_FORM_NOTIFICATION` | Notificaciones generales |
| `ZCL_E_FORM_QI_ATTACHMENTS_DMS` | Adjuntos DMS |
| `ZCL_E_FORM_TXT_DOCTYPE` | Tipo de documento de texto |
| `ZCL_E_FORM_WF_ATTACHMENTS` | Adjuntos del workflow |
| `ZCL_MAIL_SENDER` | Envío de mails |
| `ZCL_P_NOTIFICACIONES_SOLPED` | Notificaciones de SOLPED |

### Clases de tipo de formulario (escenarios)

| Clase | Descripción |
|---|---|
| `ZCL_FORM_CONTRATO` | Formulario de Contrato |
| `ZCL_FORM_CONTRATO_VIRTUAL` | Contrato virtual |
| `ZCL_FORM_CONTRATO_TEXT_VIRTUAL` | Texto de contrato virtual |
| `ZCL_FORM_ESCENARIO_CONT` | Escenario de contrato |
| `ZCL_FORM_ESCENARIO_OC` | Escenario de OC |
| `ZCL_FORM_ADJ_CONT` | Adjunto/modificación de contrato |
| `ZCL_FORM_ADJ_OC` | Adjunto/modificación de OC |
| `ZCL_FORM_HEADER_VIRTUAL` | Cabecera virtual del formulario |
| `ZCL_FORM_VISULIZACION` | Visualización del formulario |
| `ZFORMCL_E_DMS_ATTACHMENTS_MAN` | Gestión manual de adjuntos DMS |

### Clases helper del módulo SOLICITUD_PEDIDO (desde API Forms)

| Clase | Descripción |
|---|---|
| `ZCL_MCB_FORMS_UTILS` | Utilidades compartidas para API Forms |
| `ZCL_MCB_FORMS_API_HC` | Helper para la API principal |
| `ZCL_MCB_FORMS_CONTRACT_HC` | Helper para API de Contratos |
| `ZCL_MCB_FORMS_MC_HC` | Helper para API Modificación de Contrato |
| `ZCL_MCB_FORMS_MO_HC` | Helper para API Modificación de OC |
| `ZCL_MCB_FORMS_REQUEST_HC` | Helper para API Mis Solicitudes |
| `ZCL_MCB_CE_FORMS_MANAGEMENT` | Gestión custom entity Forms |

### Clases del módulo MCB core (ZMM_MCB_01)

| Clase | Descripción |
|---|---|
| `ZCL_MCB_UTILS` | Clase de utilidades generales MCB |
| `ZCL_MCB_PRICE_LIST` | Lógica de negocio de Price List |
| `ZCL_MCB_FLUJO_COMPRA_DET` | Implementa `ZCDS_MCB_FLUJO_FORMULARIOS` (RAP Query Provider + AMDP); retorna el flujo completo incluyendo aprobadores (de `CDHDR`/`CDPOS`), fechas de workflow (`SWW_WI2OBJ`), montos netos (`EKPO`) |
| `ZCL_MCB_PF_CONTROLLER` | Implementa el Process Flow (RAP Query Provider + AMDP); construye lanes y nodos desde `ZTMM_FORMS`, `EKPO`, `EKBE`, `MATDOC`, `RBKP` |
| `ZCL_MCB_FORMLOG_SLA` | Log de SLA del formulario |
| `ZCL_MCB_TL_LOG_SLA_CONTROLLER` | Controlador del Timeline SLA |

### OData V2 (SAP Gateway)

| Clase | Descripción |
|---|---|
| `ZCL_ZGW_CORP_SOLPEDS_MPC` / `_MPC_EXT` | Model Provider Class del servicio SOLPEDS V2 |
| `ZCL_ZGW_CORP_SOLPEDS_DPC` / `_DPC_EXT` | Data Provider Class del servicio SOLPEDS V2 |

---

## Behavior Definitions (RAP)

| BDEF | Descripción |
|---|---|
| `ZI_MCB_PL_APP` | Price List — behavior de interfaz |
| `ZC_MCB_PL_APP` | Price List — behavior de consumo |
| `ZFORM_CDS_I_HEADER` | Forms — behavior de interfaz (cabecera) |
| `ZFORM_CDS_C_HEADER` | Forms — behavior de consumo (cabecera) |
| `ZFORM_ADD_INPVALIDACART` | Validación de carrito (acción/behavior) |
| `ZI_SOLPED_001` | SOLPED — behavior de interfaz |

---

## Servicios OData

### OData V4 (Service Binding)

| SRVB | SRVD | Descripción |
|---|---|---|
| `ZSRV_MCB_FLUJO_COMPRAS` | `ZSRV_MCB_FLUJO_COMPRA` | Servicio Flujo de Compra (custom entity `ZCDS_MCB_FLUJO_FORMULARIOS`) |
| `ZSRV_MCB_LOG_SLA` | `ZSRV_MCB_LOG_SLA` | Servicio Log SLA |
| `ZSRV_MCB_LOG_SLA_V2` | — | Servicio Log SLA V2 |
| `ZFORM_UI_SRV_SOLPED_O2` | `ZFORM_UI_SRV_SOLPED` | Servicio Fiori Elements de formularios (principal) |
| `ZSRV_UI_SOLPED` | — | Servicio UI SOLPED |
| `Z_I_ASIGN_SOLPED_001` | `ZI_ASIGN_SOLPED_001` | Asignación de SOLPED |
| `Z_I_SOLPED_003` / `Z_I_SOLPED_004` | `ZI_SOLPED_002` / `ZI_SOLPED_003` | SOLPED V3/V4 |
| `Z_I_BOOKING_001` | `ZI_BOOKING_002` | Bookings |

### OData V2 (SAP Gateway)

| Servicio | Descripción |
|---|---|
| `ZGW_CORP_SOLPEDS_SRV` | Servicio V2 corporativo de solicitudes de pedido |
| `ZFORM_UI_SRV_SOLPED_O2` | Servicio UI V2 de formularios |

---

## Grupos de Funciones

| FUGR | Descripción |
|---|---|
| `ZTMM_FORMS` | FM principales del proceso de formularios |
| `ZTMM_FORMITEMS` | FM para posiciones de formulario |
| `ZTMM_FORMIMPS` | FM para imputaciones |
| `ZTMM_FORMLOG` | FM para log de formularios |
| `ZFGR_FORM_WF` | FM del workflow de formularios |
| `ZFGR_WORKDAY_UTILITIES` | Utilidades de integración con Workday |
| `ZMMSOLPEDS` | FM para SOLPED MM |
| `ZMMT_RESP_FORMS` | Responsables de formularios |
| `ZMM_FORMS_CONFIG` | Configuración general de formularios |
| `ZTMM_CONFIG_F02..F10` | Configuración por tipo de formulario (F02 al F10) |
| `ZTMM_CONTR_EDITO` | Contratos — editores |
| `ZTMM_CONTR_SOLIC` | Contratos — solicitantes |
| `ZTMM_RESP_FORMS` | Responsables de formularios |
| `ZTMM_FORM_WF_BR` | Business Rules de workflow |
| `ZGF_MCB_PL` | FM de Price List (incluye `ZMM_MCB_PL_SAVE`) |

---

## Programas ABAP

| Programa | Descripción |
|---|---|
| `ZMM_MCB_CAMBIO_ESTADO` | Cambio masivo de estado de formularios MCB |
| `ZMM_P_MCB_VERIF_TAB_01` | Verificación de consistencia tabla 1 |
| `ZMM_P_MCB_VERIF_TAB_02` | Verificación de consistencia tabla 2 |
| `ZMM_R_FORMS_CONFIG` | Reporte de configuración de formularios |
| `ZMM_FORMS_CONFIG` | Programa principal de configuración (con screens F00, F01, F05, F08-F11) |
| `ZMM_SOLPEDS_UPLOAD_IMAGES` | Upload de imágenes para SOLPED |
| `ZR_NOTIFICACIONES_SOLPED` | Envío de notificaciones de SOLPED |

---

## Transacciones

| Transacción | Descripción |
|---|---|
| `ZMM_MCB_PL_GRUPOS` | Grupos de Price List |
| `ZMM_MCB_PL_FIXER` | Fixer de Price List |
| `ZMM_MCB_DATA_CHECK` | Data check de tablas MCB |
| `ZMM_MCB_USER_CONFIG` (1-5) | Configuración de usuario MCB (5 variantes) |
| `ZMM_MCB_SUBEST_TEXTS` | Textos de sub-estados |
| `ZMM_MCB_ADD_ATT` | Agregar adjuntos |
| `ZMM_MCB_VERIF_01` / `_02` | Verificación de tablas MCB |
| `ZMM_FORMS_CONFIG` | Configuración general de formularios |
| `ZMM_CONFIG_TABLE_01..11` | Mantenimiento de tablas de configuración |
| `ZMM_FORMS_TAB01..17` | Mantenimiento de tablas específicas por tipo de formulario |
| `ZRESP_FORMS` | Mantenimiento de responsables de formularios |

---

## Interfaces y constantes

| Objeto | Descripción |
|---|---|
| `ZFORM_CONSTANTS` | Interfaz ABAP con constantes globales del módulo Forms |
| `ZIF_E_FORM_SLA` | Interfaz para eventos de SLA |

---

## Mail Templates (Smart Templates)

| Template | Descripción |
|---|---|
| `ZFORM_MAIL_USR_NOTIF` / `_1..3` | Notificaciones de usuario (4 variantes) |
| `ZFORM_WF_BR_APPROVER` | Mail para aprobador en workflow |
| `ZFORM_WF_BR_REJECTION` | Mail de rechazo en workflow |

---

## Enhancement / User Exits

| Objeto | Tipo | Descripción |
|---|---|---|
| `ZMM_MCB` | CMOD (Enhancement Project) | Proyecto de extensión de MM para MCB |
| `ZXM06U36` | User Exit (REPS) | Exit del módulo MM06 para órdenes de compra |

---

## Tipos de datos ABAP

### Dominios clave (`ZD_*`, `ZDOM_*`)

| Dominio | Descripción |
|---|---|
| `ZD_TIPO_FORM` | Tipo de formulario |
| `ZD_TIPO_WF` | Tipo de workflow |
| `ZD_AGENTE` | Agente del formulario |
| `ZD_AREA_MCB` | Área MCB |
| `ZD_CONTRATO` | Contrato |
| `ZD_SEGMENTO` | Segmento de negocio |
| `ZD_PRICELIST` | Price List |
| `ZESTADOSOLPED` | Estado de solicitud de pedido |
| `ZFORM_DOM_TIPOSOLICITUD` | Tipo de solicitud (CC=Contrato Nuevo, MC=Modif. Contrato, OC=Orden Compra) |

### Tipos de tabla (`ZTTY_*`, `ZTTY_FORM_*`)

| Tipo | Descripción |
|---|---|
| `ZTTY_FORM_LOG` | Tabla de log del formulario |
| `ZTTY_FORM_SOLPEDS` | Tabla de SOLPEDs |
| `ZTTY_FORM_DURATION` | Tabla de duraciones |
| `ZTTY_FORM_LINKS` | Links del formulario |
| `ZTTY_SALDOS_CONTRATO` | Saldos de contrato |
| `ZTTY_IDFORMULARIO` | IDs de formulario |
| `ZTTATTACHMENTS` | Adjuntos |
| `ZTTITEMS` | Items |
| `ZTTIMPS` | Imputaciones |
| `ZTTEDITORES` | Editores |
| `ZTTCOLABORADORES` | Colaboradores |
| `ZFORM_MESSAGES` | Mensajes del formulario |

---

## Órdenes de transporte relevantes

| Transporte | Descripción | Estado |
|---|---|---|
| `DS4K9A1ZP4` | S 5000026229: SDFPSINIC-12966 — Módulo completo Solicitud de Pedidos | Liberado (06/06/2024) a TS4.400 |
| `DS4K9B4RES` | Desarrollos MCB core: Process Flow, Flujo de Formularios (Herrera) | En desarrollo (DS4) |
| `DS4K9B506W` | SLA Log Timeline | En desarrollo (DS4) |

---

## Sub-módulo GSP (Gestión de Solicitudes de Pedido — API Layer)

### Propósito

GSP es la **capa de API externa** del módulo Forms/SOLPED. Define el contrato de servicio mediante **RAP Abstract Entities** (`define root abstract entity`) que actúan como parámetros tipados de entrada/salida para las operaciones del proceso de compra. El servicio OData V4 `ZSRV_GSP_FORM_PO` expone estas entidades a clientes externos (Fiori, BTP, integraciones).

- **Paquete:** `ZMM_SOLICITUD_PEDIDO`
- **Servicio:** `ZSRV_GSP_FORM_PO` (SRVD + SRVB — OData V4)
- **Función Group auxiliar:** `ZMM_FORMS_GSP`
- **Nomenclatura:** prefijo `ZCDS_GSP_A_` para abstract entities, `ZCDS_GSP_A_*_IN` para inputs, `ZCDS_GSP_A_*_OUT` para outputs

### Operaciones expuestas

#### Consulta de solicitudes

| Abstract Entity | Descripción |
|---|---|
| `ZCDS_GSP_A_GET_MY_REQUESTS` | Filtros de búsqueda para "Mis Solicitudes": `idformulario`, `fechacreaciondesde/hasta`, `responsable_compras`, `pais` (multi-valor), `tiposolicitud` (multi-valor), `estado` (multi-valor), etc. |
| `ZCDS_GSP_A_GET_REQUEST_DETAIL` | Parámetros para obtener el detalle completo de una solicitud |

#### Creación de OC directa (`PO`)

Entidad raíz: `ZCDS_GSP_A_PO_HEADER` — cabecera de creación de OC con composiciones:

| Composición | Abstract Entity hija | Descripción |
|---|---|---|
| `_Items` | `ZCDS_GSP_A_PO_ITEMS` | Items/posiciones de la OC |
| `_Description` | `ZCDS_GSP_A_PO_DESCRIPTION` | Descripción de la OC |
| `_Brief` | `ZCDS_GSP_A_PO_BRIEF` | Brief comercial |
| `_Colaboradores` | `ZCDS_GSP_A_PO_COLLABORATORS` | Colaboradores de la OC |
| `_Imports` | `ZCDS_GSP_A_PO_IMPORTS` | Datos de importación |
| `_Attachments` | `ZCDS_GSP_A_PO_ATTACHMENTS` | Adjuntos de la OC |
| `_Comments` | `ZCDS_GSP_A_PO_COMMENTS` | Comentarios de la OC |
| `_RE` | `ZCDS_GSP_A_PO_RE` | Resumen Ejecutivo |

Entidades de soporte del RE: `ZCDS_GSP_A_PO_RE_ITEMS`, `ZCDS_GSP_A_PO_RE_ITEMS_ATT`

Resultado: `ZCDS_GSP_A_PO_CRE_RESULT`

#### Creación de OC por Contrato (`POTL` — PO from Contract)

Entidad raíz: `ZCDS_GSP_A_POTL_HEADER` (BDEF) con composiciones:

| Composición | Abstract Entity hija | Descripción |
|---|---|---|
| `_Items` | `ZCDS_GSP_A_POTL_ITEMS` | Items de la OC |
| `_Description` | `ZCDS_GSP_A_POTL_DESCRIPTION` | Descripción |
| `_Collaborators` | `ZCDS_GSP_A_POTL_COLLABORATORS` | Colaboradores |
| `_Imports` | `ZCDS_GSP_A_POTL_IMPORTS` | Importaciones |
| `_Imps` | `ZCDS_GSP_A_POTL_IMPS` | Imputaciones |
| `_Attachments` | `ZCDS_GSP_A_POTL_ATTACHMENTS` | Adjuntos |

#### Creación de Contrato (`CONTRACT`)

Entidad raíz: `ZCDS_GSP_A_CONTRACT_CREATE` (BDEF) con composiciones:

| Composición | Abstract Entity hija | Descripción |
|---|---|---|
| `_Items` | `ZCDS_GSP_A_CONTRACT_ITEM` | Items del contrato |
| `_Description` | `ZCDS_GSP_A_CONTRACT_DESCRIPT` | Descripción |
| `_Editores` | `ZCDS_GSP_A_EDITORES` | Editores del contrato |
| `_Imputation` | `ZCDS_GSP_A_CONTRACT_IMPUTATION` | Imputación |

Resultado: `ZCDS_GSP_A_CONTRACT_RESULT`

#### Modificación de OC (`MODIFY_PO`)

| Abstract Entity | BDEF | Descripción |
|---|---|---|
| `ZCDS_GSP_A_MODIFY_PO_IN` | Sí | Entrada: datos de la modificación con composiciones `_Att`, `_Colab`, `_Desc`, `_Imp`, `_Item` |
| `ZCDS_GSP_A_MODIFY_PO_OUT` | — | Resultado de la modificación |

#### Modificación de Contrato (`MODIFY_CT`)

| Abstract Entity | BDEF | Descripción |
|---|---|---|
| `ZCDS_GSP_A_MODIFY_CT_IN` | Sí | Entrada: datos de la modificación con composiciones `_Att`, `_Colab`, `_Desc`, `_Editor`, `_Imp`, `_Item` |
| `ZCDS_GSP_A_MODIFY_CT_OUT` | — | Resultado de la modificación |

#### Entidades genéricas reutilizables

| Abstract Entity | Descripción |
|---|---|
| `ZCDS_GSP_A_ATTACHMENT` | Adjunto genérico |
| `ZCDS_GSP_A_COLABORADOR` | Colaborador genérico |
| `ZCDS_GSP_A_CANCEL_REQUEST` | Parámetros para cancelar solicitud |
| `ZCDS_GSP_A_OPERATION_RESULT` | Resultado genérico de cualquier operación |
| `ZCDS_GSP_A_DETAIL_ATTACHMENT` | Adjunto en detalle de solicitud |
| `ZCDS_GSP_A_DETAIL_COLABORADOR` | Colaborador en detalle |
| `ZCDS_GSP_A_DETAIL_COMMENT` | Comentario en detalle |
| `ZCDS_GSP_A_DETAIL_DESCRIPTION` | Descripción en detalle |
| `ZCDS_GSP_A_DETAIL_IMPUTATION` | Imputación en detalle |
| `ZCDS_GSP_A_DETAIL_ITEM` | Item en detalle |

### Patrón RAP de Abstract Entity en GSP

Las abstract entities GSP usan el tipo `define root abstract entity`. Las que tienen BDEF asociado son los **puntos de entrada de acciones RAP** (action parameters). El servicio las expone directamente como endpoints OData V4:

```abap
" Definición típica de una abstract entity GSP
@EndUserText.label: 'Cabecera para creación de PO'
define root abstract entity ZCDS_GSP_A_PO_HEADER
{
  key idformulario  : zemmidformulario;
  key version       : zdte_form_version;
      Titulo        : zdte_form_title;
      proveedor     : lifnr;
      ...
      _Items        : composition [1..*] of zcds_gsp_a_po_items;
      _Description  : composition [1..1] of zcds_gsp_a_po_description;
      ...
}
```

```abap
" Filtros multi-valor en abstract entities GSP
" Se pasan como strings separados por comas
pais           : abap.string(0);   // "AR,BR,CL"
tiposolicitud  : abap.string(0);   // "O,C"
estado         : abap.string(0);   // "FXA,ASG,COM"
```

### Relación GSP con el resto del módulo Forms

```
Cliente (Fiori / BTP / Integración)
         ↓ OData V4
ZSRV_GSP_FORM_PO  (SRVB)
         ↓
ZCDS_GSP_A_*  (Abstract Entities — contrato de la API)
         ↓ invoca acciones via EML
ZBP_FORM_CDS_I_HEADER / ZBP_GENERATE_SOLPEDS_001 / ...  (Behavior Providers)
         ↓
ZTMM_FORMS / ZTMM_FORMITEMS / ...  (Tablas de persistencia)
```

---

## Convenciones de nombres

| Prefijo | Ámbito |
|---|---|
| `ZMM_MCB_` | Objetos MM generales MCB (programas, transacciones, funciones) |
| `ZCL_MCB_` | Clases de negocio MCB |
| `ZCL_FORM_` | Clases de negocio de formularios/SOLPED |
| `ZBP_` | Behavior Providers RAP |
| `ZCX_` | Clases de excepción |
| `ZCDS_MCB_` | CDS custom entities MCB |
| `ZI_MCB_` | CDS de interfaz RAP MCB (Price List) |
| `ZC_MCB_` | CDS de consumo RAP MCB |
| `ZFORM_CDS_I_` | CDS de interfaz RAP Forms |
| `ZFORM_CDS_C_` | CDS de consumo RAP Forms |
| `ZI_SOLPED_` / `ZI_BOOKING_` | CDS RAP de SOLPED/Bookings |
| `ZTMM_` | Tablas DDIC del proceso Forms/SOLPED |
| `ZTMM_PL_` | Tablas DDIC de Price List |
| `ZTMM_CONFIG_F` | Tablas de configuración por tipo de formulario |
| `ZSRV_MCB_` | Service Definitions y Bindings MCB |
| `ZGW_CORP_SOLPEDS` | Servicio OData V2 corporativo SOLPED |
| `ZFGR_` / `ZGF_MCB_` | Grupos de funciones |
| `ZD_` / `ZDOM_` / `ZDTE_` | Dominios y elementos de datos |
| `ZTTY_` / `ZFORMTTY_` | Tipos de tabla |
| `ZMCB_` | Objetos de numeración/configuración MCB |
| `ZFORM_MAIL_` / `ZFORM_WF_` | Templates de mail |

---

## Patrones de implementación

### Custom Entities con RAP Query Provider + AMDP

Las vistas de tipo `define root custom entity` no leen directamente de tablas; su clase controladora implementa `IF_RAP_QUERY_PROVIDER` (método `SELECT`) e `IF_AMDP_MARKER_HDB` (métodos AMDP con SQLSCRIPT HANA). Patrón:

```abap
CLASS zcl_mcb_pf_controller IMPLEMENTATION.
  METHOD get_data_entities.        " IF_RAP_QUERY_PROVIDER~SELECT
    CASE io_request->get_entity_id( ).
      WHEN 'ZCDS_MCB_C_PF_HEADER'. ...
      WHEN 'ZCDS_MCB_C_PF_LANES'.  ...
      WHEN 'ZCDS_MCB_C_PF_NODES'.  ...
    ENDCASE.
  ENDMETHOD.
  METHOD get_historical_docs       " AMDP — SQLSCRIPT en HANA
    BY DATABASE PROCEDURE FOR HDB LANGUAGE SQLSCRIPT ...
  ENDMETHOD.
ENDCLASS.
```

### Jerarquía del Process Flow

El Process Flow (`ZCDS_MCB_C_PF_HEADER`) se construye en 3 niveles de entidad servidos en el mismo `get_data_entities`:
1. **Header** (`ZCDS_MCB_C_PF_HEADER`): 1 registro por formulario
2. **Lanes** (`ZCDS_MCB_C_PF_LANES`): carril por tipo de documento (Contrato Marco, Formulario, OC, Recepción, Factura, Pago)
3. **Nodes** (`ZCDS_MCB_C_PF_NODES`): un nodo por documento individual; campo `children` es string con IDs separados por coma que apuntan a nodos hijos

### Flujo de aprobación

El campo `approverN1..N6` en `ZCDS_MCB_FLUJO_FORMULARIOS` se obtiene leyendo la tabla de cambio de documentos SAP (`CDHDR` / `CDPOS`) sobre `ZTMM_FORMS`. Las fechas de recepción de workflow se leen de `SWW_WI2OBJ`.

---

## Arquitectura RAP (RESTful Application Programming Model)

MCB usa RAP como modelo de programación principal para todos sus módulos modernos. Hay tres variantes de implementación RAP en el proyecto:

| Variante | Módulos MCB | Característica |
|---|---|---|
| **Managed BO** | Price List | SAP gestiona el CRUD automáticamente; solo se implementan validations/actions |
| **Unmanaged BO** | Forms / SOLPED | El desarrollador implementa todo el CRUD + actions en Behavior Providers |
| **Custom Entity (Query Provider)** | Process Flow, SLA Timeline, Flujo de Formularios | Solo lectura; datos calculados vía AMDP (HANA SQLScript) |

---

### Stack RAP completo — Módulo Price List (Managed BO)

```
┌─────────────────────────── DATA MODEL ────────────────────────────────┐
│  ztmm_pl_header (temporal)  ztmm_pl_headertm  ztmm_pl_itemstmp        │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌──────────────────────── INTERFACE CDS LAYER ──────────────────────────┐
│  ZI_MCB_PL_APP          (define root view entity — from ztmm_pl_header)│
│    └─ ZI_MCB_PL_HEADER  (define view entity — from ztmm_pl_headertm)  │
│           └─ ZI_MCB_PL_ITEM (define view entity — from ztmm_pl_itemstmp)│
│  ZI_MCB_PL_CHECK_HEADER / ZI_MCB_PL_CHECK_ITEMS  (validations)        │
│  ZI_MCB_PL_RESP_BUYER_UNIQUE                      (uniqueness check)  │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌──────────────────── BEHAVIOR DEFINITION (Interface) ──────────────────┐
│  BDEF: ZI_MCB_PL_APP   → managed                                       │
│        validations: validateHeader, validateItems                      │
│        actions:    submit                                              │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌──────────────────────── PROJECTION CDS LAYER ─────────────────────────┐
│  ZC_MCB_PL_APP          (define root projection view)                  │
│    ├─ ZC_MCB_PL_HEADER                                                 │
│    └─ ZC_MCB_PL_ITEM                                                   │
│  ZC_MCB_PL_SUBMIT       (acción submit expuesta a UI)                  │
│  ZC_MCB_PL_EXTENDER     (extensión de la proyección)                   │
│  ZC_MCB_PL_CHECK_HEADER / ZC_MCB_PL_CHECK_ITEMS (validations consumo) │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌──────────────────── BEHAVIOR DEFINITION (Consumption) ────────────────┐
│  BDEF: ZC_MCB_PL_APP   → projection; acciones: submit                  │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌───────────────────────────── SERVICE LAYER ───────────────────────────┐
│  SRVD: ZSRV_MCB_*                                                      │
│  SRVB: (OData V4 — binding tipo UI para Fiori Elements)                │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Stack RAP completo — Módulo Forms / SOLPED (Unmanaged BO)

```
┌─────────────────────────── DATA MODEL ────────────────────────────────┐
│  ZTMM_FORMS  ZTMM_FORMITEMS  ZTMM_FORMIMPS  ZTMM_FORMLOG             │
│  ZTMM_SOLPEDS  ZTMM_ITEMSOLPEDS  ZTBOOKING_001  ...                   │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌──────────────────────── INTERFACE CDS LAYER ──────────────────────────┐
│  ZFORM_CDS_I_HEADER       (define root view entity — root BO)          │
│    ├─ ZFORM_CDS_I_ITEMS                                                │
│    ├─ ZFORM_CDS_I_CONTRATO / ZFORM_CDS_I_OC                           │
│    ├─ ZFORM_CDS_I_COMMENTS / ZFORM_CDS_I_COMMENT_ATTACH               │
│    ├─ ZFORM_CDS_I_HISTORIAL / ZFORM_CDS_I_HISTORIALAUX                │
│    ├─ ZFORM_CDS_I_IMPSOLPED                                            │
│    ├─ ZFORM_CDS_I_VALIDACART / ZFORM_CDS_I_INPVALIDACART              │
│    └─ ZFORM_CDS_I_CONTRATOMARCO / ZFORM_CDS_I_CONTRATOMARCO_IMP       │
│  ZI_SOLPED_001            (SOLPED RAP BO root)                         │
│  ZI_SOLPED_002            (SOLPED V2)                                  │
│  ZI_BOOKING_001           (Bookings BO root)                           │
│  ZI_ASIGN_SOLPED          (asignación de SOLPED)                       │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌──────────────────── BEHAVIOR DEFINITION (Interface) ──────────────────┐
│  BDEF: ZFORM_CDS_I_HEADER → unmanaged (CRUD propio)                    │
│        actions: generateSolpeds, generateBookings, ...                 │
│        validations: validateCart (ZFORM_ADD_INPVALIDACART)             │
│  BDEF: ZI_SOLPED_001      → unmanaged                                  │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌───────────────────────── BEHAVIOR PROVIDERS ──────────────────────────┐
│  ZBP_FORM_CDS_I_HEADER      → implementa CRUD + actions del formulario │
│  ZBP_I_SOLPED_001           → implementa CRUD de SOLPED                │
│  ZBP_GENERATE_SOLPEDS_001   → acción: genera SOLPEDs SAP (MM)          │
│  ZBP_GENERATE_BOOKINGS_001  → acción: genera Bookings                  │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌──────────────────────── PROJECTION CDS LAYER ─────────────────────────┐
│  ZFORM_CDS_C_HEADER       (define root projection view — Fiori Forms)  │
│    ├─ ZFORM_CDS_C_ITEMS / ZFORM_CDS_C_CONTRATO / ZFORM_CDS_C_OC       │
│    ├─ ZFORM_CDS_C_COMMENTS / ZFORM_CDS_C_COMMENT_ATTACH               │
│    ├─ ZFORM_CDS_C_REVISIONES / ZFORM_CDS_C_IMPSOLPED                  │
│    └─ ZFORM_CDS_C_ATTACHMENTS / ZFORM_CDS_C_ATTACHMENTS_DMS           │
│  ZC_MISFORMS / ZC_MISFORMSIMPS / ZC_MISFORMSITEMS  ("Mis Formularios") │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌──────────────────── BEHAVIOR DEFINITION (Consumption) ────────────────┐
│  BDEF: ZFORM_CDS_C_HEADER  → projection; acciones expuestas a UI       │
└──────────────────────────────────┬────────────────────────────────────┘
                                   ↓
┌───────────────────────────── SERVICE LAYER ───────────────────────────┐
│  SRVD: ZFORM_UI_SRV_SOLPED, ZI_SOLPED_002/003, ZI_BOOKING_002         │
│  SRVB (OData V4 UI):  ZFORM_UI_SRV_SOLPED_O2, ZSRV_UI_SOLPED         │
│  SRVB (OData V4 API): Z_I_SOLPED_003, Z_I_SOLPED_004                  │
│                        Z_I_ASIGN_SOLPED_001, Z_I_BOOKING_001           │
│  OData V2 (legacy):   ZGW_CORP_SOLPEDS_SRV (MPC/DPC Gateway)          │
└───────────────────────────────────────────────────────────────────────┘
```

---

### Stack RAP — Custom Entities (Query Provider + AMDP)

Estos módulos usan `define root custom entity` anotado con `@ObjectModel.query.implementedBy`. No tienen BDEF, son **solo lectura**. Cada clase controladora implementa `IF_RAP_QUERY_PROVIDER` (método `SELECT`) e `IF_AMDP_MARKER_HDB` (métodos AMDP con HANA SQLScript).

```
┌─────────────────────────────────────────────────────────────────────┐
│              CUSTOM ENTITY  (define root custom entity)              │
│  @ObjectModel.query.implementedBy: 'ABAP:<QueryProvider>'            │
└────────────────────────────┬────────────────────────────────────────┘
                             ↓
┌────────────────────── QUERY PROVIDER CLASS ─────────────────────────┐
│  Implements: IF_RAP_QUERY_PROVIDER                                    │
│             IF_AMDP_MARKER_HDB                                        │
│                                                                       │
│  METHOD if_rap_query_provider~select:                                 │
│    CASE io_request->get_entity_id( ).                                 │
│      WHEN '<ENTITY_1>'. ...                                           │
│      WHEN '<ENTITY_2>'. ...   ← multi-entidad en 1 clase             │
│    ENDCASE.                                                           │
│                                                                       │
│  METHOD get_data AMDP BY DATABASE PROCEDURE FOR HDB                  │
│    LANGUAGE SQLSCRIPT OPTIONS READ-ONLY ...  ← HANA SQLScript        │
└─────────────────────────────────────────────────────────────────────┘
```

| Módulo | Custom Entity (root) | Composiciones | Query Provider |
|---|---|---|---|
| **Flujo de Formularios** | `ZCDS_MCB_FLUJO_FORMULARIOS` | — (root plana) | `ZCL_MCB_FLUJO_COMPRA_DET` |
| **Process Flow** | `ZCDS_MCB_C_PF_HEADER` | `ZCDS_MCB_C_PF_LANES` → `ZCDS_MCB_C_PF_NODES` | `ZCL_MCB_PF_CONTROLLER` |
| **SLA Timeline** | `ZCDS_MCB_C_TL_LOG_SLA_H` | `ZCDS_MCB_C_TL_LOG_SLA_L` → `ZCDS_MCB_C_TL_LOG_SLA_N` | `ZCL_MCB_TL_LOG_SLA_CONTROLLER` |

**Fuentes de datos usadas por los AMDP:**

| Query Provider | Tablas SAP estándar leídas via AMDP |
|---|---|
| `ZCL_MCB_FLUJO_COMPRA_DET` | `ZTMM_FORMS`, `EKPO`, `CDHDR`/`CDPOS` (aprobadores), `SWW_WI2OBJ` (fechas WF) |
| `ZCL_MCB_PF_CONTROLLER` | `ZTMM_FORMS`, `ZTMM_FORMITEMS`, `EKKO`, `EKPO`, `EKBE`, `MATDOC`, `RBKP`, `DD07T` |
| `ZCL_MCB_TL_LOG_SLA_CONTROLLER` | Log SLA custom MCB |

---

### Acciones RAP en MCB

| Acción | Tipo | BDEF | Behavior Provider | Descripción |
|---|---|---|---|---|
| `generateSolpeds` | Instance action | `ZFORM_CDS_I_HEADER` | `ZBP_GENERATE_SOLPEDS_001` | Crea solicitudes de pedido SAP (MM) desde el formulario |
| `generateBookings` | Instance action | `ZFORM_CDS_I_HEADER` | `ZBP_GENERATE_BOOKINGS_001` | Crea Bookings desde el formulario |
| `submit` | Instance action | `ZC_MCB_PL_APP` | — | Confirma y envía una Price List |
| `validateCart` | Validation | `ZFORM_ADD_INPVALIDACART` | — | Valida el carrito de compras antes de generar SOLPED |

---

### Uso de EML (Entity Manipulation Language)

Los Behavior Providers de MCB usan EML para manipular instancias del BO sin pasar por la capa OData:

```abap
" Patrón típico en ZBP_GENERATE_SOLPEDS_001 / ZBP_FORM_CDS_I_HEADER
MODIFY ENTITIES OF zform_cds_i_header
  ENTITY header
    EXECUTE generateSolpeds
    FROM VALUE #( ... )
  RESULT DATA(lt_result)
  FAILED DATA(lt_failed)
  REPORTED DATA(lt_reported).

" Lectura con EML
READ ENTITIES OF zform_cds_i_header
  ENTITY header
  FIELDS ( idformulario estado tiposolicitud )
  WITH VALUE #( ... )
  RESULT DATA(lt_header)
  FAILED DATA(lt_failed).
```

Los BPs que utilizan EML son: `ZBP_FORM_CDS_I_HEADER`, `ZBP_I_SOLPED_001`, `ZBP_GENERATE_SOLPEDS_001`, `ZBP_GENERATE_BOOKINGS_001`.

---

### Tipos de Service Binding en MCB

| Service Binding | Tipo OData | Binding Type | Propósito |
|---|---|---|---|
| `ZFORM_UI_SRV_SOLPED_O2` | V4 | UI — Fiori Elements | App principal de formularios de compra |
| `ZSRV_UI_SOLPED` | V4 | UI — Fiori Elements | App SOLPED |
| `ZSRV_MCB_FLUJO_COMPRAS` | V4 | UI — Fiori Elements | App Flujo de Compra (Process Flow) |
| `ZSRV_MCB_LOG_SLA` / `_V2` | V4 | UI — Fiori Elements | App SLA Log Timeline |
| `Z_I_SOLPED_003` / `Z_I_SOLPED_004` | V4 | API | Integración externa — SOLPEDs |
| `Z_I_ASIGN_SOLPED_001` | V4 | API | Integración externa — Asignación |
| `Z_I_BOOKING_001` | V4 | API | Integración externa — Bookings |
| `ZGW_CORP_SOLPEDS_SRV` | V2 | UI (legado Gateway) | Servicio OData V2 via SAP Gateway (MPC/DPC) |

---

## Cómo navegar el código MCB

1. **Para entender el flujo de un formulario** → leer `ZCL_FORM_SOLPED_HANDLER` (orquestador)
2. **Para ver el estado/datos de un formulario** → tabla `ZTMM_FORMS` + CDS `ZCDS_MCB_FLUJO_FORMULARIOS`
3. **Para ver el Process Flow visual** → CDS `ZCDS_MCB_C_PF_HEADER` + `ZCL_MCB_PF_CONTROLLER`
4. **Para ver el Timeline SLA** → CDS `ZCDS_MCB_C_TL_LOG_SLA_H` + `ZCL_MCB_TL_LOG_SLA_CONTROLLER`
5. **Para la API Fiori del usuario** → SRVB `ZFORM_UI_SRV_SOLPED_O2` y BDEF `ZFORM_CDS_C_HEADER`
6. **Para la Price List** → CDS `ZI_MCB_PL_APP` → `ZI_MCB_PL_HEADER` → `ZI_MCB_PL_ITEM` / BDEF `ZC_MCB_PL_APP`
7. **Para configuración** → transacciones `ZMM_CONFIG_TABLE_01..11` / tablas `ZTMM_CONFIG_F01..F10`
8. **Para workflow** → función group `ZFGR_FORM_WF` / clase `ZCL_E_FORM_WF_BR`

---

## Contexto del proyecto

- **Cliente:** MercadoLibre
- **Implementador:** Globant (en los headers del código aparece "Servicios de Globant")
- **Sistema SAP:** S/4HANA — DS4 (Desarrollo, cliente 200) / TS4 (UAT, cliente 400) / PS4 (Prod, cliente 400)
- **Jira/Solman:** Los tickets se referencian en los headers como `SDFPSINIC-XXXXX` y solicitudes de servicio `S XXXXXXXXXX`
- **Autor principal identificado en código:** Mauricio Herrera
