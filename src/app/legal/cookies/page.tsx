import LegalLayout from "@/components/legal/LegalLayout";

export default function CookiesPage() {
    return (
        <LegalLayout title="Política de Cookies" date="21 de Noviembre, 2025">
            <section className="space-y-4">
                <p>
                    POLLNOW utiliza cookies y tecnologías similares para garantizar el correcto
                    funcionamiento de la plataforma y la integridad de las votaciones. No utilizamos
                    cookies de terceros para publicidad comportamental.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>¿Qué es una cookie?</h3>
                <p>
                    Una cookie es un pequeño archivo de texto que se almacena en tu navegador cuando
                    visitas casi cualquier página web. Su utilidad es que la web sea capaz de recordar
                    tu visita cuando vuelvas a navegar por esa página.
                </p>
            </section>

            <section className="mt-10 space-y-4">
                <h3>Cookies que utilizamos</h3>

                <div className="mt-4 space-y-6">
                    <div>
                        <h4 className="text-base font-semibold text-white">
                            1. Cookies Técnicas y de Seguridad (Esenciales)
                        </h4>
                        <p className="mt-1">
                            Son necesarias para que la web funcione y no pueden desactivarse.
                        </p>
                        <ul className="mt-3 space-y-3 list-disc ml-6">
                            <li>
                                <strong>voter_id:</strong> Esta cookie es fundamental para nuestro
                                sistema de votación anónima. Asigna un identificador único aleatorio a tu
                                navegador para evitar que se vote múltiples veces en la misma categoría. No
                                contiene datos personales.
                                <br />
                                <em className="text-xs text-gray-500">Duración: 1 año.</em>
                            </li>
                            <li>
                                <strong>voted_[poll.id]:</strong> Esta cookie es fundamental para nuestro
                                sistema de votación anónima. Asigna un identificador único aleatorio a tu
                                navegador para evitar que se vote múltiples veces en la misma categoría. No
                                contiene datos personales.
                                <br />
                                <em className="text-xs text-gray-500">
                                    Duración: Indefinido.
                                </em>
                                
                            </li>
                            <li>
                                <strong>selected_[poll.id]:</strong> Esta cookie es fundamental para nuestro
                                sistema de votación anónima. Asigna un identificador único a tu selección. No
                                contiene datos personales.
                                <br />
                                <em className="text-xs text-gray-500">
                                    Duración: Indefinido.
                                </em>
                                
                            </li>
                            <li>
                                <strong>authjs.session-token:</strong> Se utiliza para mantener tu sesión
                                iniciada de forma segura si eres un usuario registrado.
                                <br />
                                <em className="text-xs text-gray-500">
                                    Duración: Sesión / Persistente.
                                </em>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base font-semibold text-white">
                            2. Cookies de Terceros (Pagos)
                        </h4>
                        <ul className="mt-3 space-y-2">
                            <li>
                                <strong>Stripe:</strong> Utilizamos Stripe para procesar pagos. Stripe puede
                                instalar cookies para la detección de fraudes y el procesamiento seguro de las
                                transacciones.
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="mt-10 space-y-4">
                <h3>Gestión de Cookies</h3>
                <p>
                    Dado que solo utilizamos cookies esenciales para el funcionamiento del servicio
                    (Login y Votación), su aceptación es necesaria para utilizar POLLNOW. Puedes
                    bloquearlas en la configuración de tu navegador, pero es probable que la plataforma
                    deje de funcionar correctamente (ej: no podrás votar ni entrar en tu cuenta).
                </p>
            </section>
        </LegalLayout>
    );
}
