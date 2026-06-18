import 'package:freezed_annotation/freezed_annotation.dart';
import '../domain/alerta.dart';

part 'estado_alertas.freezed.dart';

/// Estado de UI de la lista de alertas.
@freezed
class EstadoAlertas with _$EstadoAlertas {
  const factory EstadoAlertas.inicial() = AlertasInicial;
  const factory EstadoAlertas.cargando() = AlertasCargando;
  const factory EstadoAlertas.exito(List<Alerta> alertas) = AlertasExito;
  const factory EstadoAlertas.error(String mensaje) = AlertasError;
}
