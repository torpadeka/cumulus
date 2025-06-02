import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    PenTool,
    MessageSquare,
    BookOpen,
    FileText,
    Clock,
    Inbox,
    List,
    Star,
    Notebook,
    Tag,
    TimerIcon as Timeline,
    Grid3X3,
    Folder,
    Brain,
} from "lucide-react";

export default function Component() {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <PenTool className="w-8 h-8 text-gray-700" />
                <h1 className="text-3xl font-bold text-gray-800">
                    Notes Dashboard
                </h1>
            </div>

            <div className="flex gap-6">
                {/* Sidebar */}
                <div className="w-64 space-y-8">
                    {/* Quick Capture */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">
                            Quick Capture
                        </h2>
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <MessageSquare className="w-4 h-4 mr-3" />
                                Fleeting Note
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <BookOpen className="w-4 h-4 mr-3" />
                                Literature Note
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <FileText className="w-4 h-4 mr-3" />
                                Permanent Note
                            </Button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">
                            Navigation
                        </h2>
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <Clock className="w-4 h-4 mr-3" />
                                Recent
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <Inbox className="w-4 h-4 mr-3" />
                                Inbox
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <List className="w-4 h-4 mr-3" />
                                To Review
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <Star className="w-4 h-4 mr-3" />
                                Favorites
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <Notebook className="w-4 h-4 mr-3" />
                                Notebooks
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <Tag className="w-4 h-4 mr-3" />
                                Topics
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-gray-600 hover:text-gray-800"
                            >
                                <Timeline className="w-4 h-4 mr-3" />
                                Timeline
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-8">
                    {/* Notes Section */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Notes
                        </h2>
                        <Tabs defaultValue="recent" className="w-full">
                            <TabsList className="grid w-full grid-cols-5 bg-white">
                                <TabsTrigger
                                    value="recent"
                                    className="text-gray-600"
                                >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Recent
                                </TabsTrigger>
                                <TabsTrigger
                                    value="inbox"
                                    className="text-gray-600"
                                >
                                    <Inbox className="w-4 h-4 mr-2" />
                                    Inbox
                                </TabsTrigger>
                                <TabsTrigger
                                    value="favorites"
                                    className="text-gray-600"
                                >
                                    <Star className="w-4 h-4 mr-2" />
                                    Favorites
                                </TabsTrigger>
                                <TabsTrigger
                                    value="topics"
                                    className="text-gray-600"
                                >
                                    <Tag className="w-4 h-4 mr-2" />
                                    Topics
                                </TabsTrigger>
                                <TabsTrigger
                                    value="all"
                                    className="text-gray-600"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    All Notes
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="recent" className="mt-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <Card className="bg-white">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-600" />
                                                <CardTitle className="text-sm font-medium">
                                                    With or Without You Energy
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-gray-600 mb-2">
                                                A mindset that something will
                                                happen regardless of whether
                                                someone chooses to be involved
                                                or not.
                                            </p>
                                            <span className="text-xs text-gray-500">
                                                Literature
                                            </span>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-600" />
                                                <CardTitle className="text-sm font-medium">
                                                    Save for Actionability
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-gray-600 mb-2">
                                                In building up our external
                                                knowledge, we want to prioritize
                                                saving for actionability in
                                                which we make connections to our
                                                current and future projects and
                                                goals and allow for our...
                                            </p>
                                            <span className="text-xs text-gray-500">
                                                Permanent
                                            </span>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-gray-600" />
                                                <CardTitle className="text-sm font-medium">
                                                    Art of Not Forcing
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-gray-600 mb-2">
                                                Wu wei is the art of not
                                                forcing, where your actions feel
                                                natural without any mental
                                                resistance. It is not about
                                                doing nothing or taking the easy
                                                way out, it requires...
                                            </p>
                                            <span className="text-xs text-gray-500">
                                                Permanent
                                            </span>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Notebooks Section */}
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            Notebooks
                        </h2>
                        <Tabs defaultValue="gallery" className="w-full">
                            <TabsList className="bg-white">
                                <TabsTrigger
                                    value="gallery"
                                    className="text-gray-600"
                                >
                                    <Grid3X3 className="w-4 h-4 mr-2" />
                                    Gallery
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="gallery" className="mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card className="bg-white">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <Folder className="w-5 h-5 text-gray-600" />
                                                <CardTitle className="text-base">
                                                    Routines
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-500">
                                                2 Notes
                                            </p>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white">
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <Brain className="w-5 h-5 text-gray-600" />
                                                <CardTitle className="text-base">
                                                    Building a Second Brain
                                                </CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-500">
                                                3 Notes
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </div>
    );
}
