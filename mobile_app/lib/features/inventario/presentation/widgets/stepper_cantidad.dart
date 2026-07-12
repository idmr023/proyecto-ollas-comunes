import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';

/// Selector de cantidad con botones grandes de − y +, fiel al mockup.
class StepperCantidad extends StatelessWidget {
  const StepperCantidad({
    super.key,
    required this.valor,
    required this.unidad,
    required this.onIncrementar,
    required this.onDecrementar,
  });

  final int valor;
  final String unidad;
  final VoidCallback onIncrementar;
  final VoidCallback onDecrementar;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: ColoresApp.superficie,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: ColoresApp.borde),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          _Boton(
            icono: Icons.remove_rounded,
            primario: false,
            onTap: onDecrementar,
          ),
          Column(
            children: <Widget>[
              Text(
                '$valor',
                style: const TextStyle(
                  fontSize: 44,
                  fontWeight: FontWeight.w800,
                  color: ColoresApp.textoPrincipal,
                  height: 1,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                unidad,
                style: const TextStyle(
                  fontSize: 13,
                  color: ColoresApp.textoTenue,
                ),
              ),
            ],
          ),
          _Boton(
            icono: Icons.add_rounded,
            primario: true,
            onTap: onIncrementar,
          ),
        ],
      ),
    );
  }
}

class _Boton extends StatelessWidget {
  const _Boton({
    required this.icono,
    required this.primario,
    required this.onTap,
  });

  final IconData icono;
  final bool primario;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: primario ? ColoresApp.primario : ColoresApp.fondo,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          width: 56,
          height: 56,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: primario
                ? null
                : Border.all(color: ColoresApp.bordeInput, width: 1.5),
          ),
          child: Icon(
            icono,
            color: primario ? Colors.white : ColoresApp.textoPrincipal,
            size: 26,
          ),
        ),
      ),
    );
  }
}
