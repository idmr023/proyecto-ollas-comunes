import 'package:freezed_annotation/freezed_annotation.dart';
import '../../../auth/domain/entidades/usuario.dart';
import '../../domain/entidades/resumen_dashboard.dart';

part 'estado_dashboard.freezed.dart';

/// Estado de UI del dashboard de inicio.
@freezed
class EstadoDashboard with _$EstadoDashboard {
  const factory EstadoDashboard.inicial() = DashboardInicial;
  const factory EstadoDashboard.cargando() = DashboardCargando;
  const factory EstadoDashboard.exito(Usuario usuario, ResumenDashboard resumen) = DashboardExito;
  const factory EstadoDashboard.error(String mensaje) = DashboardError;
}
