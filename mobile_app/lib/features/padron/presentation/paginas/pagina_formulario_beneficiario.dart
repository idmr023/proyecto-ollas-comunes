import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../../config/router/app_router.dart';
import '../../../../core/tema/colores_app.dart';
import '../../../../shared/widgets/estados/vista_error.dart';
import '../../../../shared/widgets/modales/modal_error.dart';
import '../../../../shared/widgets/modales/modal_exito.dart';
import '../../domain/datos_beneficiario.dart';
import '../../domain/entidades/beneficiario.dart';
import '../../domain/entidades/condicion_salud.dart';
import '../../domain/entidades/olla_referencia.dart';
import '../../domain/entidades/prioridad.dart';
import '../controllers/controller_formulario.dart';
import '../controllers/controller_padron.dart';
import '../estado/estado_formulario.dart';

/// Formulario de alta o edición de un beneficiario del padrón.
@RoutePage(name: 'FormularioBeneficiarioRoute')
class PaginaFormularioBeneficiario extends ConsumerStatefulWidget {
  const PaginaFormularioBeneficiario({super.key, this.beneficiario});

  /// Si viene un beneficiario, el formulario edita; si es null, crea uno nuevo.
  final Beneficiario? beneficiario;

  @override
  ConsumerState<PaginaFormularioBeneficiario> createState() =>
      _PaginaFormularioBeneficiarioState();
}

class _PaginaFormularioBeneficiarioState
    extends ConsumerState<PaginaFormularioBeneficiario> {
  final GlobalKey<FormState> _formulario = GlobalKey<FormState>();
  final TextEditingController _nombres = TextEditingController();
  final TextEditingController _apellidos = TextEditingController();
  final TextEditingController _dni = TextEditingController();

  bool _opcionesListas = false;
  String? _errorCarga;
  List<CondicionSalud> _condiciones = <CondicionSalud>[];
  List<OllaReferencia> _ollas = <OllaReferencia>[];

  DateTime? _fechaNacimiento;
  OllaReferencia? _olla;
  Prioridad _prioridad = Prioridad.normal;
  final Set<int> _condicionesSeleccionadas = <int>{};

  bool get _esEdicion => widget.beneficiario != null;

  @override
  void initState() {
    super.initState();
    _precargar();
    Future<void>.microtask(
      () => ref.read(controllerFormularioProvider.notifier).cargarOpciones(),
    );
  }

  void _precargar() {
    final Beneficiario? b = widget.beneficiario;
    if (b == null) return;
    _nombres.text = b.nombres;
    _apellidos.text = b.apellidos;
    _dni.text = b.dni ?? '';
    _fechaNacimiento = b.fechaNacimiento;
    _prioridad = b.prioridad;
    _condicionesSeleccionadas.addAll(b.condiciones.map((c) => c.id));
  }

  @override
  void dispose() {
    _nombres.dispose();
    _apellidos.dispose();
    _dni.dispose();
    super.dispose();
  }

  void _alCargarOpciones(
    List<CondicionSalud> condiciones,
    List<OllaReferencia> ollas,
  ) {
    _condiciones = condiciones;
    _ollas = ollas;
    final String? ollaId = widget.beneficiario?.ollaId;
    if (ollaId != null) {
      for (final OllaReferencia o in ollas) {
        if (o.id == ollaId) {
          _olla = o;
          break;
        }
      }
    }
    setState(() {
      _opcionesListas = true;
      _errorCarga = null;
    });
  }

  Future<void> _reaccionar(EstadoFormulario estado) async {
    switch (estado) {
      case FormularioListo(
        :final List<CondicionSalud> condiciones,
        :final List<OllaReferencia> ollas,
      ):
        if (!_opcionesListas) _alCargarOpciones(condiciones, ollas);
      case FormularioGuardado():
        await ModalExito.mostrar(
          context,
          mensaje: _esEdicion
              ? 'Los cambios se guardaron correctamente.'
              : 'El beneficiario se registró en el padrón.',
        );
        if (!mounted) return;
        await ref.read(controllerPadronProvider.notifier).cargar();
        if (!mounted) return;
        context.router.popUntilRouteWithName(HomeRoute.name);
      case FormularioError(:final String mensaje):
        if (!_opcionesListas) {
          setState(() => _errorCarga = mensaje);
        } else {
          ref.read(controllerFormularioProvider.notifier).volverAListo();
          await ModalError.mostrar(context, mensaje: mensaje);
        }
      case FormularioCargando() || FormularioGuardando():
        break;
    }
  }

  Future<void> _elegirFecha() async {
    final DateTime ahora = DateTime.now();
    final DateTime? elegida = await showDatePicker(
      context: context,
      initialDate: _fechaNacimiento ?? DateTime(ahora.year - 30),
      firstDate: DateTime(1900),
      lastDate: ahora,
      helpText: 'Fecha de nacimiento',
    );
    if (elegida != null) setState(() => _fechaNacimiento = elegida);
  }

  void _guardar() {
    if (!_formulario.currentState!.validate()) return;
    if (_fechaNacimiento == null) {
      ModalError.mostrar(
        context,
        titulo: 'Falta un dato',
        mensaje: 'Selecciona la fecha de nacimiento.',
      );
      return;
    }
    final DatosBeneficiario datos = DatosBeneficiario(
      nombres: _nombres.text.trim(),
      apellidos: _apellidos.text.trim(),
      fechaNacimiento: _fechaNacimiento!,
      prioridad: _prioridad,
      condicionIds: _condicionesSeleccionadas.toList(),
      dni: _dni.text.trim(),
      ollaId: _olla?.id,
    );
    ref
        .read(controllerFormularioProvider.notifier)
        .guardar(datos, idEdicion: widget.beneficiario?.id);
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<EstadoFormulario>(
      controllerFormularioProvider,
      (_, EstadoFormulario e) => _reaccionar(e),
    );
    final bool guardando =
        ref.watch(controllerFormularioProvider) is FormularioGuardando;
    return Scaffold(
      backgroundColor: ColoresApp.fondo,
      appBar: AppBar(
        backgroundColor: ColoresApp.fondo,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(
            Icons.chevron_left_rounded,
            color: ColoresApp.textoPrincipal,
          ),
          onPressed: () => context.router.maybePop(),
        ),
        title: Text(
          _esEdicion ? 'Editar beneficiario' : 'Nuevo beneficiario',
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: ColoresApp.textoPrincipal,
          ),
        ),
        centerTitle: false,
      ),
      body: _cuerpo(),
      bottomNavigationBar: _opcionesListas
          ? SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: FilledButton(
                  onPressed: guardando ? null : _guardar,
                  child: guardando
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Guardar beneficiario'),
                ),
              ),
            )
          : null,
    );
  }

  Widget _cuerpo() {
    if (_errorCarga != null) {
      return VistaError(
        mensaje: _errorCarga!,
        onReintentar: () =>
            ref.read(controllerFormularioProvider.notifier).cargarOpciones(),
      );
    }
    if (!_opcionesListas) {
      return const Center(
        child: CircularProgressIndicator(color: ColoresApp.primario),
      );
    }
    return Form(
      key: _formulario,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(22, 8, 22, 24),
        children: <Widget>[
          Row(
            children: <Widget>[
              Expanded(
                child: _Campo(
                  etiqueta: 'Nombres',
                  controlador: _nombres,
                  requerido: true,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _Campo(
                  etiqueta: 'Apellidos',
                  controlador: _apellidos,
                  requerido: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Expanded(
                flex: 16,
                child: _Campo(
                  etiqueta: 'DNI',
                  controlador: _dni,
                  teclado: TextInputType.number,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 14,
                child: _SelectorFecha(
                  fecha: _fechaNacimiento,
                  onTap: _elegirFecha,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _SelectorOlla(
            ollas: _ollas,
            seleccionada: _olla,
            onCambio: (OllaReferencia? o) => setState(() => _olla = o),
          ),
          const SizedBox(height: 16),
          _SelectorPrioridad(
            prioridad: _prioridad,
            onCambio: (Prioridad p) => setState(() => _prioridad = p),
          ),
          const SizedBox(height: 18),
          const Divider(color: Color(0xFFEAE4D9)),
          const SizedBox(height: 8),
          const Text(
            'Condiciones de salud',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: ColoresApp.textoSecundario,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 9,
            runSpacing: 9,
            children: _condiciones.map(_chipCondicion).toList(),
          ),
        ],
      ),
    );
  }

  Widget _chipCondicion(CondicionSalud condicion) {
    final bool activa = _condicionesSeleccionadas.contains(condicion.id);
    return GestureDetector(
      onTap: () => setState(() {
        activa
            ? _condicionesSeleccionadas.remove(condicion.id)
            : _condicionesSeleccionadas.add(condicion.id);
      }),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
        decoration: BoxDecoration(
          color: activa ? ColoresApp.primarioSuave : ColoresApp.superficie,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: activa ? ColoresApp.primario : ColoresApp.bordeFuerte,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(
              activa
                  ? Icons.check_box_rounded
                  : Icons.check_box_outline_blank_rounded,
              size: 18,
              color: activa ? ColoresApp.primario : ColoresApp.textoPlaceholder,
            ),
            const SizedBox(width: 7),
            Text(
              condicion.nombre,
              style: TextStyle(
                fontSize: 13.5,
                fontWeight: FontWeight.w600,
                color: activa
                    ? ColoresApp.primarioOscuro
                    : ColoresApp.textoSecundario,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Campo extends StatelessWidget {
  const _Campo({
    required this.etiqueta,
    required this.controlador,
    this.requerido = false,
    this.teclado,
  });

  final String etiqueta;
  final TextEditingController controlador;
  final bool requerido;
  final TextInputType? teclado;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          etiqueta,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: ColoresApp.textoSecundario,
          ),
        ),
        const SizedBox(height: 7),
        TextFormField(
          controller: controlador,
          keyboardType: teclado,
          validator: requerido
              ? (String? v) =>
                    (v == null || v.trim().isEmpty) ? 'Obligatorio' : null
              : null,
        ),
      ],
    );
  }
}

class _SelectorFecha extends StatelessWidget {
  const _SelectorFecha({required this.fecha, required this.onTap});

  final DateTime? fecha;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final String texto = fecha == null
        ? 'Seleccionar'
        : DateFormat('dd/MM/yyyy').format(fecha!);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const Text(
          'Fecha de nacimiento',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: ColoresApp.textoSecundario,
          ),
        ),
        const SizedBox(height: 7),
        GestureDetector(
          onTap: onTap,
          child: Container(
            height: 56,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: ColoresApp.superficie,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: ColoresApp.bordeInput, width: 1.5),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Flexible(
                  child: Text(
                    texto,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 15,
                      color: fecha == null
                          ? ColoresApp.textoPlaceholder
                          : ColoresApp.textoPrincipal,
                    ),
                  ),
                ),
                const Icon(
                  Icons.calendar_today_outlined,
                  size: 18,
                  color: ColoresApp.textoPlaceholder,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SelectorOlla extends StatelessWidget {
  const _SelectorOlla({
    required this.ollas,
    required this.seleccionada,
    required this.onCambio,
  });

  final List<OllaReferencia> ollas;
  final OllaReferencia? seleccionada;
  final ValueChanged<OllaReferencia?> onCambio;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const Text(
          'Olla asignada',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: ColoresApp.textoSecundario,
          ),
        ),
        const SizedBox(height: 7),
        DropdownButtonFormField<OllaReferencia>(
          initialValue: seleccionada,
          isExpanded: true,
          hint: const Text(
            'Seleccionar olla',
            style: TextStyle(color: ColoresApp.textoPlaceholder, fontSize: 15),
          ),
          items: ollas
              .map(
                (OllaReferencia o) => DropdownMenuItem<OllaReferencia>(
                  value: o,
                  child: Text(o.nombre, overflow: TextOverflow.ellipsis),
                ),
              )
              .toList(),
          onChanged: onCambio,
        ),
      ],
    );
  }
}

class _SelectorPrioridad extends StatelessWidget {
  const _SelectorPrioridad({required this.prioridad, required this.onCambio});

  final Prioridad prioridad;
  final ValueChanged<Prioridad> onCambio;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        const Text(
          'Prioridad',
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: ColoresApp.textoSecundario,
          ),
        ),
        const SizedBox(height: 9),
        Row(
          children: <Widget>[
            Expanded(
              child: _Opcion(
                etiqueta: 'Normal',
                activa: prioridad == Prioridad.normal,
                onTap: () => onCambio(Prioridad.normal),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _Opcion(
                etiqueta: 'Alta',
                activa: prioridad == Prioridad.alta,
                onTap: () => onCambio(Prioridad.alta),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Opcion extends StatelessWidget {
  const _Opcion({
    required this.etiqueta,
    required this.activa,
    required this.onTap,
  });

  final String etiqueta;
  final bool activa;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 46,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: activa ? ColoresApp.primarioSuave : ColoresApp.superficie,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(
            color: activa ? ColoresApp.primario : ColoresApp.bordeFuerte,
            width: activa ? 2 : 1.5,
          ),
        ),
        child: Text(
          etiqueta,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            color: activa
                ? ColoresApp.primarioOscuro
                : ColoresApp.textoSecundario,
          ),
        ),
      ),
    );
  }
}
