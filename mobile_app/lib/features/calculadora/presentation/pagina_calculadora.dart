import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/tema/colores_app.dart';
import '../../../shared/widgets/estados/vista_error.dart';
import '../domain/receta_resumen.dart';
import '../domain/resultado_preparacion.dart';
import 'controller_calculo.dart';
import 'controller_recetas.dart';
import 'estado_calculo.dart';
import 'estado_recetas.dart';

/// Calculadora de preparación: estima ingredientes para N personas según receta
/// e inventario.
@RoutePage(name: 'CalculadoraRoute')
class PaginaCalculadora extends ConsumerStatefulWidget {
  const PaginaCalculadora({super.key});

  @override
  ConsumerState<PaginaCalculadora> createState() => _PaginaCalculadoraState();
}

class _PaginaCalculadoraState extends ConsumerState<PaginaCalculadora> {
  final TextEditingController _personas = TextEditingController();
  RecetaResumen? _receta;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(
      () => ref.read(controllerRecetasProvider.notifier).cargar(),
    );
  }

  @override
  void dispose() {
    _personas.dispose();
    super.dispose();
  }

  void _calcular() {
    if (_receta == null) return;
    final int? personas = _personas.text.trim().isEmpty
        ? null
        : int.tryParse(_personas.text.trim());
    ref
        .read(controllerCalculoProvider.notifier)
        .calcular(recetaId: _receta!.id, personas: personas);
  }

  @override
  Widget build(BuildContext context) {
    final EstadoRecetas recetas = ref.watch(controllerRecetasProvider);
    final EstadoCalculo calculo = ref.watch(controllerCalculoProvider);
    final bool calculando = calculo is CalculoCalculando;
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
        title: const Text(
          'Calculadora de preparación',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: ColoresApp.textoPrincipal,
          ),
        ),
        centerTitle: false,
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: <Widget>[
          const _Titulo('Receta'),
          const SizedBox(height: 8),
          _SelectorReceta(
            estado: recetas,
            seleccionada: _receta,
            onCambio: (RecetaResumen? r) => setState(() => _receta = r),
            onReintentar: () =>
                ref.read(controllerRecetasProvider.notifier).cargar(),
          ),
          const SizedBox(height: 18),
          const _Titulo('Personas a atender'),
          const SizedBox(height: 8),
          TextField(
            controller: _personas,
            keyboardType: TextInputType.number,
            inputFormatters: <TextInputFormatter>[
              FilteringTextInputFormatter.digitsOnly,
            ],
            decoration: const InputDecoration(
              hintText: 'Dejar vacío para usar el padrón',
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: (_receta == null || calculando) ? null : _calcular,
            child: calculando
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.4,
                      color: Colors.white,
                    ),
                  )
                : const Text('Calcular'),
          ),
          const SizedBox(height: 22),
          _Resultado(estado: calculo, onReintentar: _calcular),
        ],
      ),
    );
  }
}

class _SelectorReceta extends StatelessWidget {
  const _SelectorReceta({
    required this.estado,
    required this.seleccionada,
    required this.onCambio,
    required this.onReintentar,
  });

  final EstadoRecetas estado;
  final RecetaResumen? seleccionada;
  final ValueChanged<RecetaResumen?> onCambio;
  final VoidCallback onReintentar;

  @override
  Widget build(BuildContext context) {
    return switch (estado) {
      RecetasCargando() => const _CajaInfo(
        child: Row(
          children: <Widget>[
            SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                strokeWidth: 2.2,
                color: ColoresApp.primario,
              ),
            ),
            SizedBox(width: 12),
            Text(
              'Cargando recetas...',
              style: TextStyle(color: ColoresApp.textoTenue),
            ),
          ],
        ),
      ),
      RecetasError(:final String mensaje) => _CajaInfo(
        child: Row(
          children: <Widget>[
            Expanded(
              child: Text(
                mensaje,
                style: const TextStyle(
                  color: ColoresApp.criticoTexto,
                  fontSize: 13,
                ),
              ),
            ),
            TextButton(
              onPressed: onReintentar,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
      RecetasExito(:final List<RecetaResumen> recetas) =>
        recetas.isEmpty
            ? const _CajaInfo(
                child: Text(
                  'No hay recetas registradas en tu organización.',
                  style: TextStyle(color: ColoresApp.textoTenue),
                ),
              )
            : DropdownButtonFormField<RecetaResumen>(
                initialValue: seleccionada,
                isExpanded: true,
                hint: const Text(
                  'Selecciona una receta',
                  style: TextStyle(
                    color: ColoresApp.textoPlaceholder,
                    fontSize: 15,
                  ),
                ),
                items: recetas
                    .map(
                      (RecetaResumen r) => DropdownMenuItem<RecetaResumen>(
                        value: r,
                        child: Text(
                          '${r.nombre} (${r.racionesEstimadas} raciones)',
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    )
                    .toList(),
                onChanged: onCambio,
              ),
      _ => const SizedBox.shrink(),
    };
  }
}

class _Resultado extends StatelessWidget {
  const _Resultado({required this.estado, required this.onReintentar});

  final EstadoCalculo estado;
  final VoidCallback onReintentar;

  @override
  Widget build(BuildContext context) {
    return switch (estado) {
      CalculoInicial() => const _CajaInfo(
        child: Text(
          'Selecciona una receta y calcula cuántos ingredientes necesitas según las personas y tu inventario.',
          style: TextStyle(color: ColoresApp.textoTenue, height: 1.5),
        ),
      ),
      CalculoCalculando() => const SizedBox.shrink(),
      CalculoError(:final String mensaje) => VistaError(
        mensaje: mensaje,
        onReintentar: onReintentar,
      ),
      CalculoExito(:final ResultadoPreparacion resultado) => _Detalle(
        resultado: resultado,
      ),
      _ => const SizedBox.shrink(),
    };
  }
}

class _Detalle extends StatelessWidget {
  const _Detalle({required this.resultado});

  final ResultadoPreparacion resultado;

  @override
  Widget build(BuildContext context) {
    final bool ok = resultado.alcanzaParaTodos;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: ok ? ColoresApp.okFondo : ColoresApp.criticoFondo,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: <Widget>[
              Icon(
                ok ? Icons.check_circle_rounded : Icons.warning_amber_rounded,
                color: ok ? ColoresApp.okTexto : ColoresApp.criticoTexto,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  ok
                      ? 'El stock alcanza para ${resultado.personas} personas.'
                      : 'Faltan ${resultado.ingredientesFaltantes} insumo(s) para ${resultado.personas} personas.',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: ok ? ColoresApp.okTexto : ColoresApp.criticoTexto,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: <Widget>[
            Expanded(
              child: _Mini(
                etiqueta: 'Raciones posibles',
                valor: '${resultado.racionesPosiblesConStock}',
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _Mini(
                etiqueta: 'Personas',
                valor:
                    '${resultado.personas}${resultado.personasDesdePadron ? ' (padrón)' : ''}',
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        const _Titulo('Ingredientes necesarios'),
        const SizedBox(height: 8),
        ...resultado.ingredientes.map(_FilaIngrediente.new),
      ],
    );
  }
}

class _FilaIngrediente extends StatelessWidget {
  const _FilaIngrediente(this.ingrediente);

  final IngredienteCalculado ingrediente;

  @override
  Widget build(BuildContext context) {
    final Color color = ingrediente.alcanza
        ? ColoresApp.okPunto
        : ColoresApp.criticoPunto;
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  ingrediente.nombre,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: ColoresApp.textoPrincipal,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Necesario: ${_fmt(ingrediente.necesario)} · Stock: ${_fmt(ingrediente.stockActual)} ${ingrediente.unidad}',
                  style: const TextStyle(
                    fontSize: 12.5,
                    color: ColoresApp.textoTenue,
                  ),
                ),
              ],
            ),
          ),
          if (!ingrediente.alcanza)
            Text(
              'Falta ${_fmt(ingrediente.faltante)} ${ingrediente.unidad}',
              style: const TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
                color: ColoresApp.criticoTexto,
              ),
            ),
        ],
      ),
    );
  }
}

String _fmt(double valor) => valor == valor.roundToDouble()
    ? valor.toInt().toString()
    : valor.toString();

class _Mini extends StatelessWidget {
  const _Mini({required this.etiqueta, required this.valor});

  final String etiqueta;
  final String valor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            valor,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: ColoresApp.textoPrincipal,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            etiqueta,
            style: const TextStyle(fontSize: 12, color: ColoresApp.textoTenue),
          ),
        ],
      ),
    );
  }
}

class _CajaInfo extends StatelessWidget {
  const _CajaInfo({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: child,
    );
  }
}

class _Titulo extends StatelessWidget {
  const _Titulo(this.texto);

  final String texto;

  @override
  Widget build(BuildContext context) {
    return Text(
      texto,
      style: const TextStyle(
        fontSize: 13.5,
        fontWeight: FontWeight.w700,
        color: ColoresApp.textoSecundario,
      ),
    );
  }
}
