import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entidades/usuario.dart';

part 'estado_verificacion.freezed.dart';

/// Estado de UI del paso de verificación del código de 2 factores (TOTP).
@freezed
class EstadoVerificacion with _$EstadoVerificacion {
  const factory EstadoVerificacion.inicial() = VerificacionInicial;
  const factory EstadoVerificacion.cargando() = VerificacionCargando;
  const factory EstadoVerificacion.exito(Usuario usuario) = VerificacionExito;
  const factory EstadoVerificacion.error(String mensaje) = VerificacionError;
}
