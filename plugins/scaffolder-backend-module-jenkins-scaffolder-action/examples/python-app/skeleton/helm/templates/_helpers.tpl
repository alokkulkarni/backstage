{{/*
Expand the name of the chart.
*/}}
{{- define "python-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "python-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "python-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "python-app.labels" -}}
helm.sh/chart: {{ include "python-app.chart" . }}
{{ include "python-app.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "python-app.selectorLabels" -}}
app.kubernetes.io/name: {{ include "python-app.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "python-app.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "python-app.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Database connection string
*/}}
{{- define "python-app.databaseUrl" -}}
{{- if eq .Values.framework "django" -}}
postgresql://{{ .Values.database.username }}:{{ .Values.database.password }}@{{ .Values.database.host }}:{{ .Values.database.port }}/{{ .Values.database.name }}
{{- else -}}
postgresql+asyncpg://{{ .Values.database.username }}:{{ .Values.database.password }}@{{ .Values.database.host }}:{{ .Values.database.port }}/{{ .Values.database.name }}
{{- end }}
{{- end }}

{{/*
Redis connection string
*/}}
{{- define "python-app.redisUrl" -}}
redis://:{{ .Values.redis.password }}@{{ .Values.redis.host }}:{{ .Values.redis.port }}/0
{{- end }}

{{/*
Framework-specific command
*/}}
{{- define "python-app.command" -}}
{{- if eq .Values.framework "fastapi" -}}
["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
{{- else if eq .Values.framework "django" -}}
["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "{{ include "python-app.name" . }}.wsgi:application"]
{{- else if eq .Values.framework "flask" -}}
["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "app:app"]
{{- else -}}
["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
{{- end }}
{{- end }}
