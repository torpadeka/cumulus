import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import DeviceLinkForm from "@/components/device/device-link-form";
import IoTNotesDashboard from "@/components/iot-notes-dashboard";

async function getUser() {
    const cookieStore = cookies();
    const token = (await cookieStore).get("token")?.value;

    if (!token) {
        return null;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return null;
    }

    try {
        const client = await clientPromise;
        const db = client.db("cumulus");
        const users = db.collection("users");

        const user = await users.findOne({ _id: new ObjectId(decoded.userId) });

        if (!user) {
            return null;
        }

        return {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            deviceId: user.deviceId,
        };
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
}

export default async function Page() {
    const user = await getUser();

    if (!user) {
        redirect("/login");
    }

    // If user doesn't have a device linked, show device link form
    if (!user.deviceId) {
        return <DeviceLinkForm user={user} />;
    }

    // If user has a device linked, show the main dashboard
    return <IoTNotesDashboard user={user} />;
}
