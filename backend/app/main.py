from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from .converters import convert_code, ConversionError


class ConvertRequest(BaseModel):
	code: str = Field(..., description="Source code to convert")
	from_lang: str = Field(..., pattern="^(python|javascript)$")
	to_lang: str = Field(..., pattern="^(python|javascript)$")


class ConvertResponse(BaseModel):
	output: str


app = FastAPI(title="Code Converter", version="0.1.0")

# Allow local dev frontends
app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/health")
async def health():
	return {"status": "ok"}


@app.post("/convert", response_model=ConvertResponse)
async def convert(req: ConvertRequest):
	try:
		output = convert_code(req.code, req.from_lang, req.to_lang)
		return ConvertResponse(output=output)
	except ConversionError as ce:
		raise HTTPException(status_code=400, detail=str(ce))
	except Exception as exc:
		raise HTTPException(status_code=500, detail=f"Unexpected error: {exc}")