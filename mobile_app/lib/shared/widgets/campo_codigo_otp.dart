import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/tema/colores_app.dart';

/// Campo de ingreso de un código de 6 dígitos, dibujado como 6 casillas
/// (igual que el mockup). Internamente usa un único [TextField] oculto.
class CampoCodigoOtp extends StatefulWidget {
  const CampoCodigoOtp({
    super.key,
    required this.onCambio,
    this.onCompletado,
    this.habilitado = true,
  });

  static const int cantidadDigitos = 6;

  final ValueChanged<String> onCambio;
  final ValueChanged<String>? onCompletado;
  final bool habilitado;

  @override
  State<CampoCodigoOtp> createState() => _CampoCodigoOtpState();
}

class _CampoCodigoOtpState extends State<CampoCodigoOtp> {
  final TextEditingController _controlador = TextEditingController();
  final FocusNode _foco = FocusNode();

  @override
  void dispose() {
    _controlador.dispose();
    _foco.dispose();
    super.dispose();
  }

  void _alCambiar(String valor) {
    widget.onCambio(valor);
    if (valor.length == CampoCodigoOtp.cantidadDigitos) {
      widget.onCompletado?.call(valor);
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: <Widget>[
        Row(
          children: List<Widget>.generate(
            CampoCodigoOtp.cantidadDigitos,
            (int i) => Expanded(child: _Casilla(digito: _digitoEn(i), activa: _esActiva(i))),
          ),
        ),
        Positioned.fill(
          child: Opacity(
            opacity: 0,
            child: TextField(
              controller: _controlador,
              focusNode: _foco,
              enabled: widget.habilitado,
              autofocus: true,
              keyboardType: TextInputType.number,
              maxLength: CampoCodigoOtp.cantidadDigitos,
              showCursor: false,
              inputFormatters: <TextInputFormatter>[FilteringTextInputFormatter.digitsOnly],
              onChanged: _alCambiar,
            ),
          ),
        ),
      ],
    );
  }

  String _digitoEn(int i) => i < _controlador.text.length ? _controlador.text[i] : '';

  bool _esActiva(int i) => i == _controlador.text.length;
}

class _Casilla extends StatelessWidget {
  const _Casilla({required this.digito, required this.activa});

  final String digito;
  final bool activa;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 62,
      margin: const EdgeInsets.symmetric(horizontal: 4.5),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: activa ? ColoresApp.primario : ColoresApp.bordeInput,
          width: activa ? 2 : 1.5,
        ),
        boxShadow: activa
            ? <BoxShadow>[BoxShadow(color: ColoresApp.primario.withValues(alpha: 0.12), blurRadius: 4, spreadRadius: 4)]
            : null,
      ),
      alignment: Alignment.center,
      child: Text(
        digito,
        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: ColoresApp.textoPrincipal),
      ),
    );
  }
}
