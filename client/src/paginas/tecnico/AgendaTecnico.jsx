import CalendarioSemanal from '../../componentes/CalendarioSemanal.jsx';
// El técnico ve solo las visitas que le asignaron (el servidor filtra por usuario).
export default function AgendaTecnico() { return <CalendarioSemanal esAdmin={false} />; }
