import 'package:freezed_annotation/freezed_annotation.dart';
import '../domain/sugerencia_menu.dart';

part 'estado_menu_ia.freezed.dart';

/// Estado de UI de las sugerencias de menú.
@freezed
class EstadoMenuIa with _$EstadoMenuIa {
  const factory EstadoMenuIa.inicial() = MenuIaInicial;
  const factory EstadoMenuIa.cargando() = MenuIaCargando;
  const factory EstadoMenuIa.exito(List<SugerenciaMenu> sugerencias) =
      MenuIaExito;
  const factory EstadoMenuIa.error(String mensaje) = MenuIaError;
}
