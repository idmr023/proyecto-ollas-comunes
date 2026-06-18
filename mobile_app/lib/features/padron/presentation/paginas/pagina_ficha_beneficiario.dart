import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/modales/modal_confirmacion.dart';
import '../../../../shared/widgets/modales/modal_error.dart';
import '../../../../shared/widgets/modales/modal_exito.dart';
import '../../domain/entidades/beneficiario.dart';
import '../controllers/controller_padron.dart';
import '../widgets/chip_condicion.dart';
import '../widgets/chip_prioridad.dart';

/// Ficha de un beneficiario con sus datos personales y perfil de salud.
@RoutePage(name: 'FichaBeneficiarioRoute')
class PaginaFichaBeneficiario extends ConsumerStatefulWidget {
  const PaginaFichaBeneficiario({super.key, required this.beneficiario});

  final Beneficiario beneficiario;

  @override
  ConsumerState<PaginaFichaBeneficiario> createState() => _PaginaFichaBeneficiarioState();
}

class _PaginaFichaBeneficiarioState extends ConsumerState<PaginaFichaBeneficiario> {
  bool _procesando = false;

  Future<void> _confirmarEliminar() async {
    final bool confirmado = await ModalConfirmacion.mostrar(
      context,
      titulo: '¿Eliminar beneficiario?',
      mensaje: 'Esta acción no se puede deshacer. El beneficiario se quitará del padrón de la olla.',
      textoConfirmar: 'Sí, eliminar',
    );
    if (!confirmado) return;
    setState(() => _procesando = true);
    final String? error = await ref.read(controllerPadronProvider.notifier).eliminar(widget.beneficiario.id);
    if (!mounted) return;
    setState(() => _procesando = false);
    if (error != null) {
      await ModalError.mostrar(context, mensaje: error);
      return;
    }
    await ModalExito.mostrar(context, titulo: 'Eliminado', mensaje: 'El beneficiario se quitó del padrón.');
    if (!mounted) return;
    context.router.popUntilRouteWithName(HomeRoute.name);
  }

  Future<void> _editar() async {
    await context.router.push(FormularioBeneficiarioRoute(beneficiario: widget.beneficiario));
  }

  @override
  Widget build(BuildContext context) {
    final Beneficiario b = widget.beneficiario;
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      appBar: AppBar(
        backgroundColor: ColoresApp.fondo,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.chevron_left_rounded, color: ColoresApp.textoPrincipal),
          onPressed: () => context.router.maybePop(),
        ),
        title: const Text('Ficha del beneficiario', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: ColoresApp.textoPrincipal)),
        centerTitle: false,
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.delete_outline_rounded, color: ColoresApp.criticoPunto),
            onPressed: _procesando ? null : _confirmarEliminar,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 6, 20, 24),
        children: <Widget>[
          _TarjetaPrincipal(beneficiario: b),
          const SizedBox(height: 14),
          const _TituloSeccion('Datos personales'),
          const SizedBox(height: 8),
          _TarjetaDatos(beneficiario: b),
          const SizedBox(height: 14),
          Row(
            children: <Widget>[
              const Icon(Icons.favorite_border_rounded, color: ColoresApp.verdeMedio, size: 18),
              const SizedBox(width: 8),
              Text('Perfil de salud', style: Theme.of(context).textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          _TarjetaSalud(beneficiario: b),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
          child: FilledButton(
            onPressed: _procesando ? null : _editar,
            child: _procesando
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                : const Text('Editar beneficiario'),
          ),
        ),
      ),
    );
  }
}

class _TarjetaPrincipal extends StatelessWidget {
  const _TarjetaPrincipal({required this.beneficiario});

  final Beneficiario beneficiario;

  @override
  Widget build(BuildContext context) {
    final int? edad = beneficiario.edad;
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Column(
        children: <Widget>[
          Container(
            width: 72,
            height: 72,
            decoration: const BoxDecoration(color: ColoresApp.primarioSuave, shape: BoxShape.circle),
            alignment: Alignment.center,
            child: Text(beneficiario.iniciales, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 26, color: ColoresApp.primarioOscuro)),
          ),
          const SizedBox(height: 14),
          Text(beneficiario.nombreCompleto, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 2),
          Text(
            'DNI ${beneficiario.dni ?? 'sin registrar'}${edad != null ? ' · $edad años' : ''}',
            style: const TextStyle(fontSize: 13.5, color: ColoresApp.textoTenue),
          ),
          const SizedBox(height: 12),
          ChipPrioridad(prioridad: beneficiario.prioridad, conPrefijo: true),
        ],
      ),
    );
  }
}

class _TarjetaDatos extends StatelessWidget {
  const _TarjetaDatos({required this.beneficiario});

  final Beneficiario beneficiario;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Column(
        children: <Widget>[
          _Fila(etiqueta: 'Olla asignada', valor: beneficiario.nombreOlla ?? 'Sin asignar', conBorde: true),
          _Fila(etiqueta: 'Dirección', valor: beneficiario.direccion ?? 'No registrada', conBorde: true),
          _Fila(etiqueta: 'Teléfono', valor: beneficiario.telefono ?? 'No registrado', conBorde: false),
        ],
      ),
    );
  }
}

class _TarjetaSalud extends StatelessWidget {
  const _TarjetaSalud({required this.beneficiario});

  final Beneficiario beneficiario;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: beneficiario.tieneCondiciones
          ? Wrap(
              spacing: 8,
              runSpacing: 8,
              children: beneficiario.condiciones
                  .map((c) => ChipCondicion(nombre: c.nombre, conPunto: true))
                  .toList(),
            )
          : const Text(
              'Sin condiciones de salud registradas.',
              style: TextStyle(fontSize: 13.5, color: ColoresApp.textoTenue),
            ),
    );
  }
}

class _TituloSeccion extends StatelessWidget {
  const _TituloSeccion(this.texto);

  final String texto;

  @override
  Widget build(BuildContext context) {
    return Text(texto, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: ColoresApp.textoSecundario));
  }
}

class _Fila extends StatelessWidget {
  const _Fila({required this.etiqueta, required this.valor, required this.conBorde});

  final String etiqueta;
  final String valor;
  final bool conBorde;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 13),
      decoration: BoxDecoration(border: conBorde ? const Border(bottom: BorderSide(color: Color(0xFFF2EEE6))) : null),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text(etiqueta, style: const TextStyle(fontSize: 14, color: ColoresApp.textoTenue)),
          Flexible(child: Text(valor, textAlign: TextAlign.right, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, color: ColoresApp.textoPrincipal))),
        ],
      ),
    );
  }
}
