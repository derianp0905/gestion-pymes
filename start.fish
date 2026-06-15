#!/usr/bin/env fish
# Arranca backend y frontend en paralelo

echo "==> Iniciando backend..."
cd backend
source venv/bin/activate.fish
uvicorn app.main:app --reload --port 8000 &

echo "==> Iniciando frontend..."
cd ../frontend
npm run dev &

echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API docs: http://localhost:8000/api/docs"
echo ""
echo "Presiona Ctrl+C para detener todo"
wait
