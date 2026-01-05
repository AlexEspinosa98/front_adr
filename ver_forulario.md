Prompt para Frontend (UI + Orden + Campos + Tipos)

Instrucción general:
Construir una pantalla/formulario llamado “FORMATO ACOMPAÑAMIENTO DEL EXTENSIONISTA” que renderice las secciones en el orden exacto indicado abajo. El diseño debe ser limpio y tipo “formato institucional”:

Título grande arriba.

Debajo, mostrar metadatos del encabezado (Visita No, Coordenadas, Objetivo, Fecha/Hora).

Luego secciones numeradas (1 a 7) como “cards” o “bloques” con borde suave.

Cada campo debe mostrar: Label (texto exacto) + input acorde al tipo.

Campos requeridos marcados con *.

Mantener exactamente los nombres de los labels.

Respetar el orden de los campos dentro de cada sección.

Validación mínima: requeridos no vacíos; números con formato numérico; fechas válidas; archivos solo imagen.

Inputs tipo teléfono y documentos se guardan como string (no number).

Encabezado del formato (se muestra antes de las secciones)

Visita No

key: visit_header.visit_number

type: number (entero)

required: true

placeholder: Ej: 1

Coordenadas Geográficas

key: visit_header.coordinates

type: string

required: true

placeholder: Ej: 10.188612074, -74.065231283

Objetivo del Acompañamiento

key: visit_header.visit_objective

type: textarea

required: true

placeholder: Describa el objetivo del acompañamiento

Fecha y hora registro Acompañamiento

key: accompaniment_data.record_datetime

type: datetime

required: true

Origen registro

key: accompaniment_data.record_origin

type: select

required: true

options: ["MOVIL", "WEB"]

default: "MOVIL"

Sección 1. Identificación Del Usuario Productor

Renderizar como bloque/caja numerada “1.” con estos campos:

1.1 Nombre Completo Usuario Productor

key: producter_data.full_name

type: text

required: true

placeholder: Ej: Juan Carlos Pérez Gómez

1.2 Tipo de Documento

key: producter_data.document_type

type: select

required: true

options: ["CC","TI","CE","NIT"]

1.3 Número de Identificación

key: producter_data.document_number

type: text

required: true

placeholder: Ej: 1234567890

rule: guardar como string

1.4 Número Telefonico

key: producter_data.phone_number

type: text

required: true

placeholder: Ej: 3001234567

rule: guardar como string

Sección 2. Identificación del Predio

2.1 Nombre del Predio

key: farm_data.farm_name

type: text

required: true

placeholder: Ej: Finca La Esperanza

2.2 ASNM

key: farm_data.altitude_asnm

type: number

required: false

placeholder: Ej: 0

2.3 Departamento

key: farm_data.department

type: text

required: true

placeholder: Ej: Magdalena

2.4 Municipio

key: farm_data.municipality

type: text

required: true

placeholder: Ej: Santa Marta

2.5 Corregimiento/Vereda

key: farm_data.village

type: text

required: false

placeholder: Ej: Vereda Mock

Sección 3. Identificación Del Sistema Productivo

3.1 Linea Productiva Principal

key: productive_system.main_productive_line

type: text

required: true

placeholder: Ej: Cacao

3.2 Linea Productiva Secundaria

key: productive_system.secondary_productive_line

type: text

required: false

placeholder: Ej: Otra

3.3 Área total En Producción

key: productive_system.total_area

type: number (permite decimales)

required: true

placeholder: Ej: 15.50

Sección 4. Clasificación Del Usuario (Según Ley 1876 Del 2017)

4.1 Nivel de clasificación (último diagnóstico aplicado)

key: user_classification.classification_level

type: number (entero)

required: true

placeholder: Ej: 2

Sección 5. Enfoque Técnico Productivo

5.0 Enfoque Técnico Productivo

key: technical_focus.technical_objective

type: textarea

required: true

placeholder: Ej: Mejorar prácticas de cultivo de cacao y aumentar productividad

Sub-sección 5.1

5.1 Diagnóstico visita

key: visit_diagnosis.diagnosis

type: textarea

required: true

placeholder: Ej: Productor con buen conocimiento base pero necesita apoyo...

Sub-sección 5.2

5.2 Recomendaciones y Compromisos

key: recommendations_commitments.recommendations

type: textarea

required: true

placeholder: Ej: Implementar sistema de riego, capacitación en BPA...

Sub-sección 5.3

5.3 Se Cumplió con las recomendaciones de la visita Anterior

key: previous_visit_compliance.compliance_status

type: select

required: true

options: ["SI","NO","NO APLICA"]

default: "NO APLICA"

Sub-sección 5.4

5.4 Observaciones visita

key: visit_observations.observations

type: textarea

required: false

Sub-sección 5.5

5.5 Registro Fotográfico visita

key: photo_record.photos

type: file_upload

required: false

multiple: true

accept: image/*

UI: mostrar miniaturas y contador de archivos

Sección 6. Datos del Acompañamiento

6.1 Nombre Persona quien atiende el Acompañamiento

key: accompaniment_data.attended_by

type: text

required: true

placeholder: Ej: Usuario Productor

6.2 Solo si quien atiende la visita es diferente al productor Usuario diligencie: Trabajador UP, Persona Núcleo Familiar, Otro

key: accompaniment_data.attendee_role_if_not_producer

type: select

required: false

options: ["Trabajador UP","Persona Núcleo Familiar","Otro"]

rule UI: solo mostrar este campo si attended_by != (nombre productor)

Sección 7. Datos Del Extensionista

7.1 Nombre del Extensionista

key: extensionist_data.extensionist_name

type: text

required: true

7.2 Identificación Del Extensionista

key: extensionist_data.extensionist_id

type: text

required: true

rule: guardar como string

7.3 Perfil Profesional Del Extensionista

key: extensionist_data.professional_profile

type: text

required: false

placeholder: Ej: Ingeniera Agrónoma / Zootecnista / etc.

7.4 Fecha firma extensionista

key: extensionist_data.signature_date

type: date

required: true

7.5 Firma extensionista (si aplica en UI)

key: extensionist_data.signature

type: signature_pad (o file_upload imagen)

required: false

accept (si es archivo): image/*

Reglas de presentación (para que “se vea igual”)

Cada sección numerada debe mostrar encabezado con el número y el título exacto (Ej: 1. Identificacion Del Usuario Productor).

Dentro de sección 5, mostrar subtítulos 5.1, 5.2, 5.3, 5.4, 5.5 como sub-bloques.

Los campos tipo textarea deben tener mínimo 3 líneas visibles.

Formato institucional: tipografía normal, sin emojis, sin iconos grandes.