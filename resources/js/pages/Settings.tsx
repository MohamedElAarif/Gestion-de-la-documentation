import React from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { CheckCircle2, Lock } from "lucide-react";

export default function Settings() {
    const { data, setData, put, processing, errors, recentlySuccessful, reset } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/Settings/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: () => {
                if (errors.password) {
                    reset("password", "password_confirmation");
                }
                if (errors.current_password) {
                    reset("current_password");
                }
            },
        });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Paramètres</h1>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-gray-500" />
                        <CardTitle>Changer le mot de passe</CardTitle>
                    </div>
                    <CardDescription>
                        Assurez-vous que votre compte utilise un mot de passe long et aléatoire pour rester en sécurité.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        {recentlySuccessful && (
                            <Alert className="bg-green-50 text-green-900 border-green-200">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertTitle>Succès</AlertTitle>
                                <AlertDescription>
                                    Votre mot de passe a été mis à jour avec succès.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="current_password">Mot de passe actuel</Label>
                            <Input
                                id="current_password"
                                type="password"
                                value={data.current_password}
                                onChange={(e) => setData("current_password", e.target.value)}
                                className="max-w-md"
                                autoComplete="current-password"
                            />
                            {errors.current_password && (
                                <p className="text-sm text-red-600">{errors.current_password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Nouveau mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData("password", e.target.value)}
                                className="max-w-md"
                                autoComplete="new-password"
                            />
                            {errors.password && (
                                <p className="text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData("password_confirmation", e.target.value)}
                                className="max-w-md"
                                autoComplete="new-password"
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-red-600">{errors.password_confirmation}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={processing} className="bg-gray-900 hover:bg-gray-800">
                                {processing ? 'Enregistrement...' : 'Enregistrer'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
