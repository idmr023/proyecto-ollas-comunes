import 'package:freezed_annotation/freezed_annotation.dart';
import '../../domain/entidades/insumo.dart';

part 'estado_inventario.freezed.dart';

/// Estado de UI de la lista de inventario.
@freezed
class EstadoInventario with _$EstadoInventario {
  const factory EstadoInventario.inicial() = InventarioInicial;
  const factory EstadoInventario.cargando() = InventarioCargando;
  const factory EstadoInventario.exito(List<Insumo> insumos) = InventarioExito;
  const factory EstadoInventario.error(String mensaje) = InventarioError;
}
