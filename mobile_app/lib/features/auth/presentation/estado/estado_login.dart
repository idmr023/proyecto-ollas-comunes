import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/resultado_login.dart';

part 'estado_login.freezed.dart';

/// Estado de UI del paso de inicio de sesión (correo + contraseña).
@freezed
class EstadoLogin with _$EstadoLogin {
  const factory EstadoLogin.inicial() = LoginInicial;
  const factory EstadoLogin.cargando() = LoginCargando;
  const factory EstadoLogin.exito(ResultadoLogin resultado) = LoginExito;
  const factory EstadoLogin.error(String mensaje) = LoginError;
}
