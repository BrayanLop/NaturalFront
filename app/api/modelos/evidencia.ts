export interface Evidencia {
  id: number;
  registroServicioId: number;
  urlEvidencia: string;
  nombreArchivo: string;
  fechaSubida: string;
  empresaId?: number;
}

export interface EvidenciaUpload {
  uri: string;
  name: string;
  type: string;
}
