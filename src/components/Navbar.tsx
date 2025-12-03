import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import NavbarClient from "@/components/NavbarClient";
import { getCurrentUserPlan } from "@/lib/user-plan";


export default async function Navbar() {
    const session = await auth();

    const plan = await getCurrentUserPlan();
    const showPremium = plan.slug === "free"; // solo FREE verá el color de "PREMIUM del NAVBAR morado"

    // Obtenemos datos frescos del usuario si existe sesión
    let userData = null;

    if (session?.user?.id) {
        const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, image: true }
        });

        if (dbUser) {
            userData = {
                name: dbUser.name,
                image: dbUser.image
            };
        }
    }

    // Pasamos los datos al componente cliente que maneja la UI y el menú móvil
    return <NavbarClient user={userData} showPremium={showPremium} />;
}