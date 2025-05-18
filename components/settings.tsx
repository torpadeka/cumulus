"use client"

import { useState } from "react"
import { Card } from "@/components/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { MicIcon, BrainIcon, InfoIcon } from "lucide-react"

export function Settings() {
  // Speech settings
  const [voice, setVoice] = useState("en-US-JennyNeural")

  // AI settings
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(150)

  // Save settings
  const saveVoiceSettings = () => {
    // In a real implementation, this would update the Azure Speech configuration
    alert(`Voice set to ${voice}`)
  }

  const saveAISettings = () => {
    // In a real implementation, this would update the Azure OpenAI configuration
    alert(`AI settings updated: Temperature=${temperature}, Max Tokens=${maxTokens}`)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Speech Settings" icon={<MicIcon size={20} />}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">TTS Voice</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US-JennyNeural">en-US-JennyNeural</SelectItem>
                  <SelectItem value="en-US-GuyNeural">en-US-GuyNeural</SelectItem>
                  <SelectItem value="en-GB-SoniaNeural">en-GB-SoniaNeural</SelectItem>
                  <SelectItem value="en-AU-NatashaNeural">en-AU-NatashaNeural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={saveVoiceSettings} className="bg-[#0078D4] hover:bg-[#0063B1]">
              Apply Voice Setting
            </Button>
          </div>
        </Card>

        <Card title="AI Settings" icon={<BrainIcon size={20} />}>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">AI Temperature: {temperature.toFixed(1)}</label>
              </div>
              <Slider
                value={[temperature]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={(value) => setTemperature(value[0])}
              />
              <p className="text-xs text-gray-500">
                Lower values produce more focused, deterministic responses. Higher values produce more creative, varied
                responses.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Max Response Length: {maxTokens}</label>
              </div>
              <Slider
                value={[maxTokens]}
                min={50}
                max={500}
                step={50}
                onValueChange={(value) => setMaxTokens(value[0])}
              />
              <p className="text-xs text-gray-500">Controls the maximum length of AI-generated responses.</p>
            </div>

            <Button onClick={saveAISettings} className="bg-[#0078D4] hover:bg-[#0063B1]">
              Apply AI Settings
            </Button>
          </div>
        </Card>
      </div>

      <Card title="System Information" icon={<InfoIcon size={20} />}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-4 font-medium w-1/3">Version</td>
                <td className="py-2 px-4">Cumulus AI Assistant v1.0.0</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-4 font-medium">Azure Vision API</td>
                <td className="py-2 px-4 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Connected
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-4 font-medium">Azure Speech Services</td>
                <td className="py-2 px-4 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Connected
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-4 font-medium">Azure OpenAI</td>
                <td className="py-2 px-4 flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Connected
                </td>
              </tr>
              <tr>
                <td className="py-2 px-4 font-medium">Last Updated</td>
                <td className="py-2 px-4">{new Date().toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
