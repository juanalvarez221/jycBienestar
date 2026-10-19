import { Component, HostListener, inject } from '@angular/core';
import { LegalNoticeService } from '../core/legal-notice.service';

@Component({
  selector: 'app-legal-dialog',
  standalone: true,
  template: `
    @if (legal.open()) {
      <div class="veil" (click)="legal.hide()"></div>
      <div
        class="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-title"
        (click)="$event.stopPropagation()"
      >
        <header class="head">
          <div>
            <p class="eyebrow">JyC Bienestar</p>
            <h2 id="legal-title">Términos, condiciones y privacidad</h2>
          </div>
          <button class="close" type="button" (click)="legal.hide()" aria-label="Cerrar">
            Cerrar
          </button>
        </header>
        <div class="scroll">
          <p class="lead">
            Este aviso rige la compraventa a distancia de Power Sex Jarabe 500 ml a través de este
            sitio y de nuestros canales de atención. Al marcar la casilla de aceptación o al
            confirmar el pedido, usted declara que lo leyó, lo entendió y lo acepta. Está redactado
            para que quede claro qué compra, qué derechos tiene y hasta dónde llega nuestra
            responsabilidad, de acuerdo con la ley colombiana.
          </p>

          <article>
            <h3>1. Quién vende y qué se celebra</h3>
            <p>
              JyC Bienestar comercializa el producto identificado en este sitio. El contrato es una
              compraventa de un bien mueble, celebrada a distancia, con pago contraentrega. Se rige
              por el Código de Comercio, el Código Civil y el Estatuto del Consumidor (Ley 1480 de
              2011). Usted actúa como consumidor cuando adquiere el producto para uso personal o
              familiar.
            </p>
            <p>
              Lo que usted paga es el precio del envase que aparece en el pedido, más el flete cuando
              aplica. El envío es gratis en Medellín, Bello, Itagüí, Envigado, Sabaneta, La Estrella,
              Copacabana y Girardota. En el resto del país el flete es de aproximadamente $10.000 y
              se confirma en el pedido antes de cerrar.
            </p>
          </article>

          <article>
            <h3>2. Qué es este producto — y qué no es</h3>
            <p>
              Power Sex Jarabe 500 ml es una bebida de 500 ml a base de agua, extracto de malta,
              chontaduro y borojó, para tener en casa y usar según la etiqueta. No es un medicamento.
              No diagnostica, no trata ni previene enfermedad. No sustituye consulta médica, control
              nutricional ni indicación de un profesional de la salud.
            </p>
            <p>
              Cualquier comentario de quienes ya lo han usado describe una experiencia personal. No
              constituye promesa de resultado. El organismo de cada persona responde distinto, y
              nadie puede garantizarle un efecto concreto.
            </p>
          </article>

          <article>
            <h3>3. Información que usted debe conocer antes de usarlo</h3>
            <p>
              La Ley 1480 nos obliga a informarle de manera clara sobre el bien. Cumplimos esa
              obligación con este aviso, la ficha del producto y las indicaciones de la etiqueta.
              Léalas antes de abrirlo. Si no está de acuerdo, no lo compre o no lo use.
            </p>
            <p>
              Como ocurre con alimentos, bebidas y mezclas de origen vegetal, algunas personas
              pueden presentar molestias. Entre ellas, sin que la lista sea completa: pesadez o
              malestar digestivo, náusea, gases, acidez, dolor de cabeza, inquietud, cambios en el
              sueño, sudoración, enrojecimiento, picazón u otra sensibilidad en la piel, variación
              en el apetito o en la presión percibida, o una sensación distinta a la esperada. Eso
              puede aparecer con la primera toma, al aumentar la cantidad o al mezclarlo con otros
              productos, bebidas, medicamentos o hábitos.
            </p>
            <p>
              El riesgo es mayor si usted es alérgico o sensible a alguno de los componentes; si
              está en embarazo o lactancia; si es menor de edad; si convive con una condición
              cardiovascular, metabólica, hepática, renal, digestiva o neurológica; si toma
              medicamentos de forma habitual; o si consume alcohol u otras sustancias el mismo día.
              En esos casos, no lo use sin el criterio de quien lo trata.
            </p>
            <p>
              Si siente una reacción que le preocupe, deje de usarlo y busque atención. Conserve el
              envase y la etiqueta. Eso también le sirve a usted para ejercer sus derechos como
              consumidor si hubiera un defecto del producto.
            </p>
          </article>

          <article>
            <h3>4. Uso adecuado y riesgos que usted asume</h3>
            <p>
              Usted se obliga a usar el producto únicamente como indica la etiqueta, sin exceder la
              porción sugerida, sin dárselo a menores y sin presentarlo como tratamiento. El envase
              abierto, el almacenamiento inadecuado, la mezcla con otros productos y el uso en
              cantidades o frecuencias distintas a las señaladas son decisiones suyas.
            </p>
            <p>
              Al aceptar estos términos usted reconoce que una reacción, molestia o resultado no
              deseado puede deberse a su organismo, a un uso distinto al indicado, a la combinación
              con otros factores o a una sensibilidad que no podíamos conocer. En la medida en que
              la ley colombiana lo permite, JyC Bienestar, sus administradores, colaboradores y
              canales de venta no asumen responsabilidad por esos eventos individuales, ni por
              daños indirectos, lucro cesante, expectativas no cumplidas o decisiones que usted
              tome a partir de su experiencia con el producto.
            </p>
            <p>
              Esta limitación no pretende desconocer los derechos irrenunciables del Estatuto del
              Consumidor cuando el bien sea defectuoso, no sea conforme o se entregue en
              condiciones distintas a las ofrecidas. Esos derechos se mantienen. Lo que no cubrimos
              es el azar de cada cuerpo ni el uso por fuera de la etiqueta.
            </p>
          </article>

          <article>
            <h3>5. Calidad, conformidad y reclamos</h3>
            <p>
              Entregamos el producto cerrado, en la presentación publicada. Usted tiene derecho a
              que coincida con lo ofrecido: contenido neto, estado del envase y datos de la ficha.
              Si llega incompleto, dañado o no corresponde al pedido, avísenos de inmediato, con
              fotos del empaque y de la etiqueta, para reponer, cambiar o devolver lo pagado, según
              el caso y la Ley 1480.
            </p>
            <p>
              La garantía legal cubre defectos de calidad e idoneidad del bien. No cubre el desgaste
              natural, el mal almacenamiento en su casa, ni el hecho de que el sabor, el aroma o la
              sensación no coincidan con lo que usted esperaba, si el producto está conforme a su
              ficha.
            </p>
            <p>
              El retracto en compras a distancia (artículo 47 de la Ley 1480) procede en los
              supuestos de ley. Deja de aplicar, entre otros, cuando el bien se ha destapado,
              usado, deteriorado por su causa, o cuando se trata de un bien de consumo inmediato
              que ya no puede comercializarse. Si el envase sigue cerrado y en condiciones de
              reventa, escríbanos dentro del término legal para coordinar la devolución.
            </p>
          </article>

          <article>
            <h3>6. Pedido, entrega y pago</h3>
            <p>
              El pedido se confirma cuando usted envía el formulario o nos escribe para cerrarlo.
              El precio vigente es el publicado al confirmar. Paga al recibir, en efectivo o por el
              medio que acuerde con quien entrega. Si no hay quién reciba en la dirección indicada,
              puede haber un nuevo intento o un recargo de flete, que le avisaremos antes.
            </p>
            <p>
              Los tiempos de entrega son estimados. Un retraso logístico no anula el contrato, salvo
              que se vuelva una espera desproporcionada. Revise el paquete delante de quien entrega.
              Si nota un golpe o un sello roto, déjelo constar antes de pagar.
            </p>
          </article>

          <article>
            <h3>7. Datos personales</h3>
            <p>
              Tratamos su nombre, celular, dirección, barrio, municipio y, si lo deja, su correo,
              para tomar el pedido, coordinar la entrega, contactarlo por WhatsApp o llamada y
              atender un reclamo. La base legal es la Ley 1581 de 2012 y la ejecución del contrato.
              No vendemos su información. Puede pedir consulta, corrección o supresión cuando la
              ley lo permita, escribiéndonos a los mismos canales del pedido.
            </p>
          </article>

          <article>
            <h3>8. Aceptación</h3>
            <p>
              Si no está de acuerdo con este aviso, no confirme el pedido. Al aceptarlo, declara ser
              mayor de edad, haber leído las indicaciones de uso y comprender que el producto es una
              bebida para uso personal, no un medicamento, y que JyC Bienestar no responde por
              reacciones o resultados individuales más allá de lo que la ley obliga cuando hay un
              defecto o una entrega distinta a lo vendido.
            </p>
            <p class="fine">
              Ley aplicable: República de Colombia. Cualquier diferencia se tramita primero por
              nuestros canales de atención y, si no hay arreglo, ante las autoridades de protección
              al consumidor y los jueces competentes.
            </p>
          </article>
        </div>
        <footer class="foot">
          <button class="btn btn-primary" type="button" (click)="legal.hide()">Entendido</button>
        </footer>
      </div>
    }
  `,
  styles: [
    `
      .veil {
        position: fixed;
        inset: 0;
        z-index: 80;
        background: rgba(28, 25, 22, 0.46);
        backdrop-filter: blur(8px);
      }
      .panel {
        position: fixed;
        z-index: 81;
        top: 50%;
        left: 50%;
        display: flex;
        flex-direction: column;
        width: min(42rem, calc(100% - 1.4rem));
        height: min(42rem, calc(100svh - 1.6rem));
        transform: translate(-50%, -50%);
        border: 1px solid rgba(143, 115, 78, 0.22);
        background: linear-gradient(180deg, #fffdf9, #f6f0e6);
        box-shadow: 0 28px 70px rgba(28, 25, 22, 0.22);
      }
      .head,
      .foot {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        flex: 0 0 auto;
      }
      .head {
        padding: 1.15rem 1.15rem 0.85rem;
        border-bottom: 1px solid var(--line);
      }
      .eyebrow {
        margin-bottom: 0.35rem;
        color: var(--champagne-deep);
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }
      h2 {
        font-size: clamp(1.45rem, 3vw, 1.9rem);
        line-height: 1.05;
      }
      .close {
        border: 0;
        background: transparent;
        color: var(--ink-soft);
        cursor: pointer;
        font-size: 0.72rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }
      .scroll {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 1.1rem 1.15rem 1.4rem;
      }
      .lead {
        margin-bottom: 1.25rem;
        color: var(--ink);
        font-size: 1.02rem;
        line-height: 1.55;
      }
      article + article {
        margin-top: 1.35rem;
        padding-top: 1.15rem;
        border-top: 1px solid var(--line);
      }
      h3 {
        margin-bottom: 0.55rem;
        font-size: 1.2rem;
      }
      p {
        color: var(--ink-soft);
        font-size: 0.95rem;
        line-height: 1.62;
      }
      p + p {
        margin-top: 0.7rem;
      }
      .fine {
        font-size: 0.82rem;
        color: var(--mist);
      }
      .foot {
        padding: 0.85rem 1.15rem 1.05rem;
        border-top: 1px solid var(--line);
      }
      .foot .btn {
        width: 100%;
      }
    `,
  ],
})
export class LegalDialogComponent {
  readonly legal = inject(LegalNoticeService);

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.legal.open()) this.legal.hide();
  }
}
