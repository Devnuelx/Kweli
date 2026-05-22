"use client";

import { useState, useEffect } from "react";
import { Plus, Gift, Trophy, Calendar, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    start_date: "",
    end_date: "",
    max_winners: 100,
    prizes: [
      { name: "10% Discount Code", type: "digital", quantity: 50, win_probability: 0.1 },
      { name: "Free T-Shirt", type: "physical", quantity: 10, win_probability: 0.02 }
    ]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchCampaigns();
        setForm({ ...form, name: "", start_date: "", end_date: "" });
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const addPrize = () => {
    setForm({
      ...form,
      prizes: [...form.prizes, { name: "", type: "digital", quantity: 1, win_probability: 0.05 }]
    });
  };

  const updatePrize = (index, field, value) => {
    const newPrizes = [...form.prizes];
    newPrizes[index][field] = value;
    setForm({ ...form, prizes: newPrizes });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <p className="text-muted-foreground">Manage your instant win and loyalty campaigns.</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <Card className="glass-effect text-center p-12">
          <Gift className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Campaigns Yet</h3>
          <p className="text-muted-foreground mb-4">Create your first instant win campaign to reward customers who scan your products.</p>
          <Button onClick={() => setShowCreateModal(true)}>Create Campaign</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="glass-effect overflow-hidden">
              <div className={`h-2 w-full ${campaign.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    <CardDescription className="flex items-center mt-2">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge variant={campaign.is_active ? "default" : "secondary"}>
                    {campaign.is_active ? "Active" : "Ended"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center">
                      <Trophy className="w-4 h-4 mr-1" /> Prizes
                    </h4>
                    <div className="space-y-2">
                      {campaign.campaign_prizes?.map((prize) => (
                        <div key={prize.id} className="bg-muted/50 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{prize.name}</p>
                            <p className="text-xs text-muted-foreground">{prize.type} • {(prize.win_probability * 100).toFixed(1)}% win rate</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold">{prize.current_winners} / {prize.quantity}</p>
                            <p className="text-xs text-muted-foreground">claimed</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6">Create New Campaign</h2>
            
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign Name</label>
                  <input required type="text" className="w-full px-3 py-2 bg-background border border-border rounded-md" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Summer Promo 2025" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input required type="date" className="w-full px-3 py-2 bg-background border border-border rounded-md" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input required type="date" className="w-full px-3 py-2 bg-background border border-border rounded-md" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Prizes</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addPrize}>Add Prize</Button>
                </div>
                
                <div className="space-y-4">
                  {form.prizes.map((prize, idx) => (
                    <div key={idx} className="bg-muted/30 p-4 rounded-lg grid grid-cols-2 gap-4 border border-border/50">
                      <div className="col-span-2">
                        <label className="block text-xs text-muted-foreground mb-1">Prize Name</label>
                        <input required type="text" className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm" value={prize.name} onChange={e => updatePrize(idx, 'name', e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Quantity Available</label>
                        <input required type="number" min="1" className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm" value={prize.quantity} onChange={e => updatePrize(idx, 'quantity', parseInt(e.target.value))} />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Win Probability (0.0 to 1.0)</label>
                        <input required type="number" step="0.01" min="0" max="1" className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm" value={prize.win_probability} onChange={e => updatePrize(idx, 'win_probability', parseFloat(e.target.value))} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Create Campaign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
