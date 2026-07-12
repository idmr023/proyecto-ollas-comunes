import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/estados/lista_esqueleto.dart';
import '../../../../shared/widgets/estados/vista_error.dart';
import '../../../../shared/widgets/estados/vista_vacia.dart';
import '../../../../shared/widgets/modales/modal_confirmacion.dart';
import '../../../../shared/widgets/modales/modal_error.dart';
import '../../../../shared/widgets/modales/modal_exito.dart';
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
  bool _modoEntrega = false;
  bool _registrandoEntrega = false;
  final Set<String> _seleccionados = <String>{};

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(
      () => ref.read(controllerPadronProvider.notifier).cargar(),
    );
  }

  Future<void> _recargar() =>
      ref.read(controllerPadronProvider.notifier).cargar();

  void _alternarModoEntrega() {
    setState(() {
      _modoEntrega = !_modoEntrega;
      _seleccionados.clear();
    });
  }

  void _alternarSeleccion(Beneficiario beneficiario) {
    if (beneficiario.recibioRacionHoy) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${beneficiario.nombreCompleto} ya recibio su racion hoy.',
          ),
        ),
      );
      return;
    }
    setState(() {
      if (_seleccionados.contains(beneficiario.id)) {
        _seleccionados.remove(beneficiario.id);
      } else {
        _seleccionados.add(beneficiario.id);
      }
    });
  }

  Future<void> _registrarEntrega() async {
    if (_seleccionados.isEmpty || _registrandoEntrega) return;
    final bool confirmado = await ModalConfirmacion.mostrar(
      context,
      titulo: 'Registrar entrega',
      mensaje:
          'Se registraran ${_seleccionados.length} racion(es) para los beneficiarios seleccionados.',
      textoConfirmar: 'Registrar',
      esDestructiva: false,
    );
    if (!confirmado || !mounted) return;
    setState(() => _registrandoEntrega = true);
    final String? error = await ref
        .read(controllerPadronProvider.notifier)
        .registrarEntrega(beneficiarioIds: _seleccionados.toList());
    if (!mounted) return;
    setState(() => _registrandoEntrega = false);
    if (error != null) {
      await ModalError.mostrar(context, mensaje: error);
      return;
    }
    setState(() {
      _modoEntrega = false;
      _seleccionados.clear();
    });
    await ModalExito.mostrar(
      context,
      mensaje: 'Las raciones fueron registradas correctamente.',
    );
  }

  List<Beneficiario> _filtrar(List<Beneficiario> lista) {
    final String q = _busqueda.toLowerCase();
    return lista.where((Beneficiario b) {
      final bool coincideBusqueda =
          b.nombreCompleto.toLowerCase().contains(q) ||
          (b.dni ?? '').contains(q);
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
            modoEntrega: _modoEntrega,
            onBuscar: (String v) => setState(() => _busqueda = v),
            filtro: _filtro,
            onFiltro: (_FiltroPadron f) => setState(() => _filtro = f),
            onModoEntrega: _alternarModoEntrega,
          ),
          Expanded(child: _cuerpo(estado)),
        ],
      ),
      floatingActionButton: _modoEntrega
          ? null
          : FloatingActionButton(
              backgroundColor: ColoresApp.primario,
              onPressed: () =>
                  context.router.push(FormularioBeneficiarioRoute()),
              child: const Icon(
                Icons.add_rounded,
                color: Colors.white,
                size: 28,
              ),
            ),
      bottomNavigationBar: _modoEntrega
          ? _BarraEntrega(
              seleccionados: _seleccionados.length,
              registrando: _registrandoEntrega,
              onCancelar: _alternarModoEntrega,
              onRegistrar: _registrarEntrega,
            )
          : null,
    );
  }

  Widget _cuerpo(EstadoPadron estado) {
    return switch (estado) {
      PadronError(:final String mensaje) => VistaError(
        mensaje: mensaje,
        onReintentar: _recargar,
      ),
      PadronExito(:final List<Beneficiario> beneficiarios) => _lista(
        _filtrar(beneficiarios),
        beneficiarios.isEmpty,
      ),
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
        onAccion: padronVacio
            ? () => context.router.push(FormularioBeneficiarioRoute())
            : null,
      );
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 6, 20, 96),
      itemCount: lista.length,
      separatorBuilder: (_, _) => const SizedBox(height: 11),
      itemBuilder: (_, int i) => TarjetaBeneficiario(
        beneficiario: lista[i],
        modoEntrega: _modoEntrega,
        seleccionado: _seleccionados.contains(lista[i].id),
        onTap: () {
          if (_modoEntrega) {
            _alternarSeleccion(lista[i]);
          } else {
            context.router.push(FichaBeneficiarioRoute(beneficiario: lista[i]));
          }
        },
      ),
    );
  }
}

class _Encabezado extends StatelessWidget {
  const _Encabezado({
    required this.total,
    required this.modoEntrega,
    required this.onBuscar,
    required this.filtro,
    required this.onFiltro,
    required this.onModoEntrega,
  });

  final int total;
  final bool modoEntrega;
  final ValueChanged<String> onBuscar;
  final _FiltroPadron filtro;
  final ValueChanged<_FiltroPadron> onFiltro;
  final VoidCallback onModoEntrega;

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
            Text(
              '$total beneficiarios registrados',
              style: const TextStyle(
                fontSize: 13.5,
                color: ColoresApp.textoTenue,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: onModoEntrega,
                icon: Icon(
                  modoEntrega ? Icons.close_rounded : Icons.restaurant_rounded,
                ),
                label: Text(
                  modoEntrega
                      ? 'Cancelar entrega'
                      : 'Registrar entrega de raciones',
                ),
              ),
            ),
            const SizedBox(height: 14),
            TextField(
              onChanged: onBuscar,
              decoration: const InputDecoration(
                hintText: 'DNI, nombres o apellidos...',
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: ColoresApp.textoPlaceholder,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: <Widget>[
                _ChipFiltro(
                  etiqueta: 'Todos',
                  activo: filtro == _FiltroPadron.todos,
                  onTap: () => onFiltro(_FiltroPadron.todos),
                ),
                const SizedBox(width: 8),
                _ChipFiltro(
                  etiqueta: 'Prioridad alta',
                  activo: filtro == _FiltroPadron.prioridadAlta,
                  onTap: () => onFiltro(_FiltroPadron.prioridadAlta),
                ),
                const SizedBox(width: 8),
                _ChipFiltro(
                  etiqueta: 'Salud',
                  activo: filtro == _FiltroPadron.salud,
                  onTap: () => onFiltro(_FiltroPadron.salud),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ChipFiltro extends StatelessWidget {
  const _ChipFiltro({
    required this.etiqueta,
    required this.activo,
    required this.onTap,
  });

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
          border: Border.all(
            color: activo ? ColoresApp.verdeProfundo : ColoresApp.bordeFuerte,
          ),
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

class _BarraEntrega extends StatelessWidget {
  const _BarraEntrega({
    required this.seleccionados,
    required this.registrando,
    required this.onCancelar,
    required this.onRegistrar,
  });

  final int seleccionados;
  final bool registrando;
  final VoidCallback onCancelar;
  final VoidCallback onRegistrar;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 14),
        decoration: const BoxDecoration(
          color: ColoresApp.superficie,
          border: Border(top: BorderSide(color: ColoresApp.borde)),
        ),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  const Text(
                    'Entrega de raciones',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      color: ColoresApp.textoPrincipal,
                    ),
                  ),
                  Text(
                    '$seleccionados seleccionado(s)',
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: ColoresApp.textoTenue,
                    ),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: registrando ? null : onCancelar,
              child: const Text('Cancelar'),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: seleccionados == 0 || registrando ? null : onRegistrar,
              child: registrando
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Registrar'),
            ),
          ],
        ),
      ),
    );
  }
}
