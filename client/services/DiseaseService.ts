export async function predictDisease(form: FormData) {
  const res = await fetch('/api/disease/predict', {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch prediction');
  }
  return res.json();
}

export async function getDiseaseInfo(crop: string, disease: string, confidence?: number) {
  const res = await fetch('/api/disease/info', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ crop, disease, confidence }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to fetch disease info');
  }
  return res.json();
}
