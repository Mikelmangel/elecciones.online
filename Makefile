PY ?= scraper/.venv/bin/python

.PHONY: test actualizar build deploy

test:
	@# el node de Debian (VPS) viene sin TypeScript: ahí se saltan; los datos los valida zod en el build
	@if node -e "process.exit(process.features.typescript ? 0 : 1)"; then cd web && node --experimental-strip-types --test lib/*.test.ts; else echo "tests web saltados: node sin TypeScript"; fi
	@# un proceso por fuente: todas tienen su propio parse.py
	@for d in pipeline/fuentes/*/tests; do $(PY) -m pytest -q -p no:cacheprovider $$d || exit 1; done
	$(PY) pipeline/verificar_citas.py
	$(PY) pipeline/verificar_entrevistas.py
	$(PY) pipeline/resumenes.py --check
	@# todas las citas de todos los programas, en su página y bien formadas
	@for f in data/programas/[a-z]*.json; do $(PY) pipeline/verificar_citas.py $$(basename $$f .json) | tail -1; done; \
	 for f in data/programas/[a-z]*.json; do $(PY) pipeline/verificar_citas.py $$(basename $$f .json) > /dev/null || exit 1; done
	@# motor de verificación y crosscheck de fuentes oficiales en Rust
	cargo run --release --manifest-path crates/verificador/Cargo.toml --quiet

# Cada fuente añade aquí su fetch + parse. Después: git diff data/ (skill revisar-publicar).
actualizar:
	@# SOLO_LOCAL: fuentes tras Akamai que necesitan navegador (patchright); en el VPS se saltan
	@for d in pipeline/fuentes/*/; do \
		echo "== $$d"; \
		if [ -f $$d/SOLO_LOCAL ] && ! $(PY) -c "import patchright" 2>/dev/null; then echo "saltada: necesita navegador, se actualiza en local"; continue; fi; \
		if [ -f $$d/fetch.py ] && ! $(PY) $$d/fetch.py; then fallos="$$fallos $$d"; continue; fi; \
		if [ -f $$d/parse.py ] && ! $(PY) $$d/parse.py; then fallos="$$fallos $$d"; fi; \
	done; \
	if [ -n "$$fallos" ]; then echo "AVISO fuentes con fallo (conservan su JSON anterior):$$fallos"; fi
	$(PY) pipeline/tests_quiz.py
	$(PY) pipeline/tests_afinidad.py

build:
	cd web && pnpm build

deploy:
	docker compose -f infra/docker-compose.yml up -d --build
