import { useParams } from 'react-router-dom'

export default function AnomalyDetail() {
  const { id } = useParams()
  return (
    <div className="min-h-screen p-6">
      <h1 className="font-cinzel text-3xl text-ink">Anomaly #{id}</h1>
    </div>
  )
}
