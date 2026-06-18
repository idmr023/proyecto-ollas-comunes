import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/estados/lista_esqueleto.dart';
import '../../../../shared/widgets/estados/vista_error.dart';
import '../../../../shared/widgets/estados/vista_vacia.dart';
import '../../domain/entidades/beneficiario.dart';
import '../../domain/entidades/prioridad.dart';
import '../controllers/controller_padron.dart';
import '../estado/estado_padron.dart';
import '../widgets/tarjeta_beneficiario.dart';

/// Pestaña del padrón: lista de beneficiarios con búsqueda y filtros.
class PaginaPadron extends ConsumerStatefulWidget {
  const PaginaPadron({super.key});

  @override
  ConsumerState<PaginaPadron> createState() => _PaginaPadronState();
}

enum _FiltroPadron { todos, prioridadAlta, salud }

class _PaginaPadronState extends ConsumerState<PaginaPadron> {
  String _busqueda = '';
  _FiltroPadron _filtro = _FiltroPadron.todos;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() => ref.read(controllerPadronProvider.notifier).cargar());
  }

  Future<void> _recargar() => ref.read(controllerPadronProvider.notifier).cargar();

  List<Beneficiario> _filtrar(List<Beneficiario> lista) {
    final String q = _busqueda.toLowerCase();
    return lista.where((Beneficiario b) {
      final bool coincideBusqueda = b.nombreCompleto.toLowerCase().contains(q) || (b.dni ?? '').contains(q);
      final bool coincideFiltro = switch (_filtro) {
        _FiltroPadron.todos => true,
        _FiltroPadron.prioridadAlta => b.prioridad == Prioridad.alta,
        _FiltroPadron.salud => b.tieneCondiciones,
      };
      return coincideBusqueda && coincideFiltro;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final EstadoPadron estado = ref.watch(controllerPadronProvider);
    final int total = estado is PadronExito ? estado.beneficiarios.length : 0;
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      body: Column(
        children: <Widget>[
          _Encabezado(
            total: total,
            onBuscar: (String v) => setState(() => _busqueda = v),
            filtro: _filtro,
            onFiltro: (_FiltroPadron f) => setState(() => _filtro = f),
          ),
          Expanded(child: _cuerpo(estado)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: ColoresApp.primario,
        onPressed: () => context.router.push(FormularioBeneficiarioRoute()),
        child: const Icon(Icons.add_rounded, color: Colors.white, size: 28),
      ),
    );
  }

  Widget _cuerpo(EstadoPadron estado) {
    return switch (estado) {
      PadronError(:final String mensaje) => VistaError(mensaje: mensaje, onReintentar: _recargar),
      PadronExito(:final List<Beneficiario> beneficiarios) => _lista(_filtrar(beneficiarios), beneficiarios.isEmpty),
      _ => const ListaEsqueleto(),
    };
  }

  Widget _lista(List<Beneficiario> lista, bool padronVacio) {
    if (lista.isEmpty) {
      return VistaVacia(
        icono: Icons.groups_outlined,
        titulo: padronVacio ? 'Sin beneficiarios' : 'Sin resultados',
        mensaje: padronVacio
            ? 'Registra el primer beneficiario del padrón de tu olla.'
            : 'No encontramos beneficiarios con esa búsqueda o filtro.',
        textoAccion: padronVacio ? 'Registrar beneficiario' : null,
        onAccion: padronVacio ? () => context.router.push(FormularioBeneficiarioRoute()) : null,
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 96),
      itemCount: lista.length,
      separatorBuilder: (_, _) => const SizedBox(height: 11),
      itemBuilder: (_, int i) => TarjetaBeneficiario(
        beneficiario: lista[i],
        onTap: () => context.router.push(FichaBeneficiarioRoute(beneficiario: lista[i])),
      ),
    );
  }
}

class _Encabezado extends StatelessWidget {
  const _Encabezado({required this.total, required this.onBuscar, required this.filtro, required this.onFiltro});

  final int total;
  final ValueChanged<String> onBuscar;
  final _FiltroPadron filtro;
  final ValueChanged<_FiltroPadron> onFiltro;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text('Padrón', style: Theme.of(context).textTheme.headlineMedium),
            const SizedBox(height: 2),
            Text('$total beneficiarios registrados', style: const TextStyle(fontSize: 13.5, color: ColoresApp.textoTenue)),
            const SizedBox(height: 14),
            TextField(
              onChanged: onBuscar,
              decoration: const InputDecoration(
                hintText: 'DNI, nombres o apellidos...',
                prefixIcon: Icon(Icons.search_rounded, color: ColoresApp.textoPlaceholder),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                _ChipFiltro(etiqueta: 'Todos', activo: filtro == _FiltroPadron.todos, onTap: () => onFiltro(_FiltroPadron.todos)),
                const SizedBox(width: 8),
                _ChipFiltro(etiqueta: 'Prioridad alta', activo: filtro == _FiltroPadron.prioridadAlta, onTap: () => onFiltro(_FiltroPadron.prioridadAlta)),
                const SizedBox(width: 8),
                _ChipFiltro(etiqueta: 'Salud', activo: filtro == _FiltroPadron.salud, onTap: () => onFiltro(_FiltroPadron.salud)),
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
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: activo ? Colors.white : ColoresApp.textoSecundario),
        ),
      ),
    );
  }
}
