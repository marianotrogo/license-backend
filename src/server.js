import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import adminRoutes from './routes/admin.js';
import usersRoutes from './routes/users.js';
import licensesRoutes from './routes/licenses.js';
import verifyRoutes from './routes/verify.js';
import licencesOnlineRoutes from './routes/licencesOnline.js';
import activateRoutes from './routes/activate.js'
import reportsRouter from './routes/reports.js'

import './jobs/licensesReminder.js'

dotenv.config();
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/ping", (req, res) => res.send("pong"));
app.use('/admin', adminRoutes);
app.use('/users', usersRoutes);
app.use('/licenses', licensesRoutes);
app.use('/verify', verifyRoutes);
app.use('/licenses-online', licencesOnlineRoutes);
app.use('/activate', activateRoutes);
app.use('/reports', reportsRouter)



const port = process.env.PORT || 4443;
app.listen(port, ()=> console.log(`PosIndum license server listening on ${port}`));