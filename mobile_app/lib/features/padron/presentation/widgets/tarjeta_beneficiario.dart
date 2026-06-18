import 'package:flutter/material.dart';
import '../../../../core/tema/colores_app.dart';
import '../../domain/entidades/beneficiario.dart';
import 'chip_condicion.dart';
import 'chip_prioridad.dart';

/// Tarjeta de la lista del padrón: avatar, nombre, DNI/edad, prioridad y
/// condiciones de salud.
class TarjetaBeneficiario extends StatelessWidget {
  const TarjetaBeneficiario({super.key, required this.beneficiario, required this.onTap});

  final Beneficiario beneficiario;
  final VoidCallback onTap;

  static const List<List<Color>> _paleta = <List<Color>>[
    <Color>[ColoresApp.primarioSuave, Color(0xFFC75F22)],
    <Color>[ColoresApp.okFondo, ColoresApp.okTexto],
    <Color>[ColoresApp.saludFondo, ColoresApp.saludTexto],
    <Color>[ColoresApp.superficieAlterna, ColoresApp.verdeMedio],
  ];

  @override
  Widget build(BuildContext context) {
    final List<Color> colores = _paleta[beneficiario.id.hashCode.abs() % _paleta.length];
    final int? edad = beneficiario.edad;
    return Material(
      color: ColoresApp.superficie,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: ColoresApp.borde),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(color: colores[0], shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: Text(
                      beneficiario.iniciales,
                      style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: colores[1]),
                    ),
                  ),
                  const SizedBox(width: 13),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          beneficiario.nombreCompleto,
                          style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700, color: ColoresApp.textoPrincipal),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          'DNI ${beneficiario.dni ?? 'sin registrar'}${edad != null ? ' · $edad años' : ''}',
                          style: const TextStyle(fontSize: 12.5, color: ColoresApp.textoTenue),
                        ),
                      ],
                    ),
                  ),
                  ChipPrioridad(prioridad: beneficiario.prioridad),
                ],
              ),
              if (beneficiario.tieneCondiciones)
                Padding(
                  padding: const EdgeInsets.only(left: 59, top: 11),
                  child: Wrap(
                    spacing: 7,
                    runSpacing: 7,
                    children: beneficiario.condiciones
                        .map((c) => ChipCondicion(nombre: c.nombre))
                        .toList(),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
