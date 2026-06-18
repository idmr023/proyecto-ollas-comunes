import 'package:freezed_annotation/freezed_annotation.dart';

part 'estado_evidencia.freezed.dart';

/// Estado de UI de la subida de una evidencia.
@freezed
class EstadoEvidencia with _$EstadoEvidencia {
  const factory EstadoEvidencia.inicial() = EvidenciaInicial;
  const factory EstadoEvidencia.subiendo() = EvidenciaSubiendo;
  const factory EstadoEvidencia.exito() = EvidenciaExito;
  const factory EstadoEvidencia.error(String mensaje) = EvidenciaError;
}
