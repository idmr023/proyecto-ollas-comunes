import 'package:flutter/material.dart';
import '../../../core/tema/colores_app.dart';

/// Lista de tarjetas "esqueleto" con animación shimmer para el estado de carga.
class ListaEsqueleto extends StatefulWidget {
  const ListaEsqueleto({super.key, this.cantidad = 6});

  final int cantidad;

  @override
  State<ListaEsqueleto> createState() => _ListaEsqueletoState();
}

class _ListaEsqueletoState extends State<ListaEsqueleto> with SingleTickerProviderStateMixin {
  late final AnimationController _controlador;

  @override
  void initState() {
    super.initState();
    _controlador = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat();
  }

  @override
  void dispose() {
    _controlador.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      itemCount: widget.cantidad,
      separatorBuilder: (_, _) => const SizedBox(height: 11),
      itemBuilder: (_, _) => _TarjetaEsqueleto(animacion: _controlador),
    );
  }
}

class _TarjetaEsqueleto extends StatelessWidget {
  const _TarjetaEsqueleto({required this.animacion});

  final Animation<double> animacion;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Row(
        children: <Widget>[
          _Bloque(animacion: animacion, ancho: 46, alto: 46, radio: 13),
          const SizedBox(width: 13),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                _Bloque(animacion: animacion, ancho: 140, alto: 13, radio: 6),
                const SizedBox(height: 8),
                _Bloque(animacion: animacion, ancho: 80, alto: 11, radio: 6),
              ],
            ),
          ),
          _Bloque(animacion: animacion, ancho: 64, alto: 24, radio: 20),
        ],
      ),
    );
  }
}

class _Bloque extends AnimatedWidget {
  const _Bloque({required Animation<double> animacion, required this.ancho, required this.alto, required this.radio})
      : super(listenable: animacion);

  final double ancho;
  final double alto;
  final double radio;

  @override
  Widget build(BuildContext context) {
    final double valor = (listenable as Animation<double>).value;
    return Container(
      width: ancho,
      height: alto,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radio),
        gradient: LinearGradient(
          begin: Alignment(-1 - valor, 0),
          end: Alignment(1 - valor, 0),
          colors: const <Color>[ColoresApp.borde, Color(0xFFF7F3EC), ColoresApp.borde],
        ),
      ),
    );
  }
}
