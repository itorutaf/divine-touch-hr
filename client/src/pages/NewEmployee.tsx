import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Users, TrendingUp, ClipboardCheck, AlertTriangle, Clock,
  ArrowLeft, UserPlus, Save
} from "lucide-react";

export default function NewEmployee() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    legalFirstName: "",
    legalLastName: "",
    preferredName: "",
    dob: "",
    phone: "",
    email: "",
    addressLine1: "",
    city: "",
    state: "",
    zip: "",
    ssnLast4: "",
    roleAppliedFor: "",
    serviceLine: "" as "" | "OLTL" | "ODP" | "Skilled",
    hiringSource: "",
  });

  const { data: pendingApprovals } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: openExceptions } = trpc.dashboard.openExceptions.useQuery();

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: (data) => {
      toast.success("Employee created successfully");
      setLocation(`/employees/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const totalPending = pendingApprovals?.length || 0;
  const totalExceptions = openExceptions?.length || 0;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Employees", href: "/employees", icon: <Users className="h-4 w-4" /> },
    { label: "Approvals", href: "/approvals", icon: <ClipboardCheck className="h-4 w-4" />, badge: totalPending > 0 ? totalPending : undefined },
    { label: "Exceptions", href: "/exceptions", icon: <AlertTriangle className="h-4 w-4" />, badge: totalExceptions > 0 ? totalExceptions : undefined },
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> });
    navItems.push({ label: "Settings", href: "/settings", icon: <Clock className="h-4 w-4" /> });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.legalFirstName || !formData.legalLastName) {
      toast.error("First and last name are required");
      return;
    }

    createMutation.mutate({
      ...formData,
      serviceLine: formData.serviceLine || undefined,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AppShell 
      title="New Employee"
      actions={
        <Button variant="outline" onClick={() => setLocation("/employees")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic employee details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="legalFirstName">Legal First Name *</Label>
                  <Input
                    id="legalFirstName"
                    value={formData.legalFirstName}
                    onChange={(e) => handleChange("legalFirstName", e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="legalLastName">Legal Last Name *</Label>
                  <Input
                    id="legalLastName"
                    value={formData.legalLastName}
                    onChange={(e) => handleChange("legalLastName", e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="preferredName">Preferred Name</Label>
                  <Input
                    id="preferredName"
                    value={formData.preferredName}
                    onChange={(e) => handleChange("preferredName", e.target.value)}
                    placeholder="Johnny"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => handleChange("dob", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="john.doe@email.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ssnLast4">SSN (Last 4 digits)</Label>
                <Input
                  id="ssnLast4"
                  value={formData.ssnLast4}
                  onChange={(e) => handleChange("ssnLast4", e.target.value.slice(0, 4))}
                  placeholder="1234"
                  maxLength={4}
                  className="w-32"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
              <CardDescription>Employee's residential address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="addressLine1">Street Address</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1}
                  onChange={(e) => handleChange("addressLine1", e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="Philadelphia"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    placeholder="PA"
                  />
                </div>
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                    placeholder="19103"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Details</CardTitle>
              <CardDescription>Role and service line information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roleAppliedFor">Role Applied For</Label>
                  <Input
                    id="roleAppliedFor"
                    value={formData.roleAppliedFor}
                    onChange={(e) => handleChange("roleAppliedFor", e.target.value)}
                    placeholder="Home Health Aide"
                  />
                </div>
                <div>
                  <Label htmlFor="serviceLine">Service Line</Label>
                  <Select 
                    value={formData.serviceLine} 
                    onValueChange={(value) => handleChange("serviceLine", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service line" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OLTL">OLTL - Office of Long-Term Living</SelectItem>
                      <SelectItem value="ODP">ODP - Office of Developmental Programs</SelectItem>
                      <SelectItem value="Skilled">Skilled - Licensed Professional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="hiringSource">Hiring Source</Label>
                <Input
                  id="hiringSource"
                  value={formData.hiringSource}
                  onChange={(e) => handleChange("hiringSource", e.target.value)}
                  placeholder="Indeed, Referral, Walk-in, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/employees")}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Employee
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
