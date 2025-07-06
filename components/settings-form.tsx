"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Mail, User, Bell, Shield } from "lucide-react"

export function SettingsForm() {
  const { session } = useAuth()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Account Information */}
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <img
              src={session?.user?.picture || ""}
              alt={session?.user?.name || ""}
              className="h-12 w-12 rounded-full"
            />
            <div>
              <p className="font-medium text-gray-900">{session?.user?.name}</p>
              <p className="text-sm text-gray-600">{session?.user?.email}</p>
              <Badge className="mt-1 bg-green-100 text-green-700">Connected</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input id="display-name" defaultValue={session?.user?.name || ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select defaultValue="utc">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="est">Eastern Time</SelectItem>
                <SelectItem value="pst">Pacific Time</SelectItem>
                <SelectItem value="cet">Central European Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full">Update Account</Button>
        </CardContent>
      </Card>

      {/* Email Automation Settings */}
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-generate drafts</Label>
              <p className="text-sm text-gray-500">Automatically create draft responses</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Mark emails as read</Label>
              <p className="text-sm text-gray-500">Mark processed emails as read</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-send responses</Label>
              <p className="text-sm text-gray-500">Send approved drafts automatically</p>
            </div>
            <Switch />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence">Minimum confidence threshold</Label>
            <Select defaultValue="80">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="70">70%</SelectItem>
                <SelectItem value="80">80%</SelectItem>
                <SelectItem value="90">90%</SelectItem>
                <SelectItem value="95">95%</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full">Save Automation Settings</Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email notifications</Label>
              <p className="text-sm text-gray-500">Get notified of new classifications</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Browser notifications</Label>
              <p className="text-sm text-gray-500">Show desktop notifications</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly summary</Label>
              <p className="text-sm text-gray-500">Receive weekly activity reports</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notification-frequency">Notification frequency</Label>
            <Select defaultValue="immediate">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly digest</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
                <SelectItem value="weekly">Weekly digest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full">Save Notification Settings</Button>
        </CardContent>
      </Card>

      {/* Response Templates */}
      <Card className="border-gray-200/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Response Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name</Label>
            <Input id="company-name" placeholder="Your Company Name" defaultValue="VelocityPilot" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature">Email Signature</Label>
            <Textarea
              id="signature"
              placeholder="Best regards,&#10;[Your Name]&#10;VelocityPilot Team"
              defaultValue="Best regards,&#10;[Your Name]&#10;VelocityPilot Team"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="response-tone">Response Tone</Label>
            <Select defaultValue="professional">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="response-length">Response Length</Label>
            <Select defaultValue="medium">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (1-2 paragraphs)</SelectItem>
                <SelectItem value="medium">Medium (2-3 paragraphs)</SelectItem>
                <SelectItem value="long">Long (3+ paragraphs)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full">Save Template Settings</Button>
        </CardContent>
      </Card>
    </div>
  )
}
