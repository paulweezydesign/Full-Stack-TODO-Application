import os
import shutil
import subprocess
import tempfile
import sys
import importlib.util
from typing import Literal


Language = Literal["python", "javascript"]


class ConversionError(Exception):
	pass


def _is_transcrypt_available() -> bool:
	return importlib.util.find_spec("transcrypt") is not None


def convert_python_to_js(source_code: str) -> str:
	"""Transpile Python to JavaScript using Transcrypt.

	This function writes a temporary .py module and invokes `python -m transcrypt`,
	then reads the generated JS from __target__/module.js.
	"""
	if not _is_transcrypt_available():
		raise ConversionError("Transcrypt package is not installed.")

	with tempfile.TemporaryDirectory(prefix="py2js_") as temp_dir:
		module_name = "snippet"
		py_path = os.path.join(temp_dir, f"{module_name}.py")
		os.makedirs(temp_dir, exist_ok=True)
		with open(py_path, "w", encoding="utf-8") as f:
			f.write(source_code)

		# Call transcrypt via module to avoid PATH/script issues
		cmd = [
			sys.executable,
			"-m",
			"transcrypt",
			"-b",  # build without sourcemaps
			"-n",  # no minify
			"-p", ".none",  # no module support plugin
			py_path,
		]
		proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
		if proc.returncode != 0:
			raise ConversionError(f"Transcrypt failed: {proc.stderr or proc.stdout}")

		# Transcrypt creates __target__/snippet.js next to .py by default
		js_path = os.path.join(temp_dir, "__target__", f"{module_name}.js")
		if not os.path.exists(js_path):
			raise ConversionError("Expected output JS not found.")
		with open(js_path, "r", encoding="utf-8") as f:
			return f.read()


def convert_js_to_python(source_code: str) -> str:
	"""Attempt JavaScript to Python conversion using js2py translator.

	Note: js2py is currently incompatible with Python 3.13 due to bytecode
	changes. We attempt a lazy import and surface a helpful error if unsupported.
	"""
	try:
		from js2py.translators import translator  # type: ignore
		py_code = translator.translate_js(source_code)
		return py_code
	except RuntimeError as exc:
		# Typical message: "Your python version made changes to the bytecode"
		raise ConversionError(
			"JavaScript→Python translation is not available on this Python version. "
			"js2py does not support Python 3.13. Use Python 3.10–3.12 or an external service."
		) from exc
	except Exception as exc:
		raise ConversionError(f"js2py translation failed: {exc}") from exc


def convert_code(source_code: str, from_lang: Language, to_lang: Language) -> str:
	if from_lang == to_lang:
		return source_code
	if from_lang == "python" and to_lang == "javascript":
		return convert_python_to_js(source_code)
	if from_lang == "javascript" and to_lang == "python":
		return convert_js_to_python(source_code)
	raise ConversionError(f"Unsupported conversion: {from_lang} -> {to_lang}")