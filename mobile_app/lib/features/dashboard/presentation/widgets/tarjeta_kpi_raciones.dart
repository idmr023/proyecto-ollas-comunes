import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';

/// Tarjeta destacada (hero) con las raciones servidas hoy y la meta del día.
class TarjetaKpiRaciones extends StatelessWidget {
  const TarjetaKpiRaciones({
    super.key,
    required this.entregadas,
    required this.meta,
  });

  final int entregadas;
  final int meta;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFF3E2D2)),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: <Color>[ColoresApp.primarioSuave, Color(0xFFFFF7F0)],
        ),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: ColoresApp.primario,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(
              Icons.ramen_dining_outlined,
              color: Colors.white,
              size: 30,
            ),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text(
                'Raciones servidas hoy',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: ColoresApp.bajoTexto,
                ),
              ),
              Text(
                '$entregadas',
                style: const TextStyle(
                  fontSize: 38,
                  fontWeight: FontWeight.w800,
                  color: ColoresApp.textoPrincipal,
                  height: 1.1,
                ),
              ),
              Text(
                'Meta del día: $meta',
                style: const TextStyle(
                  fontSize: 12.5,
                  color: ColoresApp.textoTerciario,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
