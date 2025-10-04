import express from 'express';
import path from 'path';
import weatherRoutes from './controllers/weather';

const app = express();
const PORT = process.env.PORT || 3000;

const publicPath = path.join(__dirname, 'public');

app.use(express.static(publicPath));
app.use(express.json());
app.use('/weather', weatherRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});


app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});


export default app;