import 'package:freezed_annotation/freezed_annotation.dart';

part 'estado_movimiento.freezed.dart';

/// Estado de UI del registro de un movimiento de inventario.
@freezed
class EstadoMovimiento with _$EstadoMovimiento {
  const factory EstadoMovimiento.inicial() = MovimientoInicial;
  const factory EstadoMovimiento.guardando() = MovimientoGuardando;
  const factory EstadoMovimiento.exito() = MovimientoExito;
  const factory EstadoMovimiento.error(String mensaje) = MovimientoError;
}
