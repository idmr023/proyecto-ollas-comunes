import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/estados/lista_esqueleto.dart';
import '../../../../shared/widgets/estados/vista_error.dart';
import '../../../../shared/widgets/estados/vista_vacia.dart';
import '../../domain/entidades/estado_stock.dart';
import '../../domain/entidades/insumo.dart';
import '../controllers/controller_inventario.dart';
import '../estado/estado_inventario.dart';
import '../widgets/tarjeta_insumo.dart';

/// Pestaña de inventario: lista de insumos con búsqueda, filtros y semáforo.
class PaginaInventario extends ConsumerStatefulWidget {
  const PaginaInventario({super.key});

  @override
  ConsumerState<PaginaInventario> createState() => _PaginaInventarioState();
}

enum _FiltroStock { todos, critico, bajo }

class _PaginaInventarioState extends ConsumerState<PaginaInventario> {
  String _busqueda = '';
  _FiltroStock _filtro = _FiltroStock.todos;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() => ref.read(controllerInventarioProvider.notifier).cargar());
  }

  Future<void> _recargar() => ref.read(controllerInventarioProvider.notifier).cargar();

  List<Insumo> _filtrar(List<Insumo> insumos) {
    return insumos.where((Insumo i) {
      final bool coincideBusqueda = i.nombre.toLowerCase().contains(_busqueda.toLowerCase());
      final bool coincideFiltro = switch (_filtro) {
        _FiltroStock.todos => true,
        _FiltroStock.critico => i.estado == EstadoStock.critico,
        _FiltroStock.bajo => i.estado == EstadoStock.bajo,
      };
      return coincideBusqueda && coincideFiltro;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final EstadoInventario estado = ref.watch(controllerInventarioProvider);
    final int total = estado is InventarioExito ? estado.insumos.length : 0;
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      body: Column(
        children: <Widget>[
          _Encabezado(
            total: total,
            onBuscar: (String v) => setState(() => _busqueda = v),
            filtro: _filtro,
            onFiltro: (_FiltroStock f) => setState(() => _filtro = f),
          ),
          Expanded(child: _cuerpo(estado)),
        ],
      ),
    );
  }

  Widget _cuerpo(EstadoInventario estado) {
    return switch (estado) {
      InventarioError(:final String mensaje) => VistaError(mensaje: mensaje, onReintentar: _recargar),
      InventarioExito(:final List<Insumo> insumos) => _lista(_filtrar(insumos), insumos.isEmpty),
      _ => const ListaEsqueleto(),
    };
  }

  Widget _lista(List<Insumo> insumos, bool inventarioVacio) {
    if (insumos.isEmpty) {
      return VistaVacia(
        icono: Icons.inventory_2_outlined,
        titulo: inventarioVacio ? 'Sin insumos aún' : 'Sin resultados',
        mensaje: inventarioVacio
            ? 'Esta olla todavía no tiene insumos registrados en su inventario.'
            : 'No encontramos insumos con ese filtro o búsqueda.',
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 24),
      itemCount: insumos.length,
      separatorBuilder: (_, _) => const SizedBox(height: 11),
      itemBuilder: (_, int i) => TarjetaInsumo(
        insumo: insumos[i],
        onTap: () => context.router.push(DetalleInsumoRoute(insumo: insumos[i])),
      ),
    );
  }
}

class _Encabezado extends StatelessWidget {
  const _Encabezado({required this.total, required this.onBuscar, required this.filtro, required this.onFiltro});

  final int total;
  final ValueChanged<String> onBuscar;
  final _FiltroStock filtro;
  final ValueChanged<_FiltroStock> onFiltro;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Inventario', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 2),
            Text('$total insumos', style: const TextStyle(fontSize: 13.5, color: ColoresApp.textoTenue)),
            const SizedBox(height: 14),
            TextField(
              onChanged: onBuscar,
              decoration: const InputDecoration(
                hintText: 'Buscar insumo...',
                prefixIcon: Icon(Icons.search_rounded, color: ColoresApp.textoPlaceholder),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                _ChipFiltro(etiqueta: 'Todos', activo: filtro == _FiltroStock.todos, onTap: () => onFiltro(_FiltroStock.todos)),
                const SizedBox(width: 8),
                _ChipFiltro(etiqueta: 'Crítico', activo: filtro == _FiltroStock.critico, onTap: () => onFiltro(_FiltroStock.critico)),
                const SizedBox(width: 8),
                _ChipFiltro(etiqueta: 'Bajo', activo: filtro == _FiltroStock.bajo, onTap: () => onFiltro(_FiltroStock.bajo)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ChipFiltro extends StatelessWidget {
  const _ChipFiltro({required this.etiqueta, required this.activo, required this.onTap});

  final String etiqueta;
  final bool activo;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 7),
        decoration: BoxDecoration(
          color: activo ? ColoresApp.verdeProfundo : ColoresApp.superficie,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: activo ? ColoresApp.verdeProfundo : ColoresApp.bordeFuerte),
        ),
        child: Text(
          etiqueta,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: activo ? Colors.white : ColoresApp.textoSecundario,
          ),
        ),
      ),
    );
  }
}
