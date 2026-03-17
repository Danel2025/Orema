/**
 * Route API pour configurer Supabase Auth
 * Migré vers Supabase (déjà partiellement Supabase)
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/db'
import { hashPassword, hashPin } from '@/lib/auth/password'

export async function GET(request: NextRequest) {
  try {
    // Disable in production unless SETUP_TOKEN is provided
    if (process.env.NODE_ENV === 'production') {
      const setupToken = request.headers.get('x-setup-token')
      if (!setupToken || setupToken !== process.env.SETUP_TOKEN) {
        return NextResponse.json(
          { error: 'Endpoint desactive en production' },
          { status: 403 }
        )
      }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (!serviceRoleKey || serviceRoleKey === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'SUPABASE_SERVICE_ROLE_KEY non configuré',
          instructions: [
            '1. Allez sur le dashboard Supabase',
            '2. Copiez le "service_role key" (section "Project API keys")',
            '3. Ajoutez-le dans .env: SUPABASE_SERVICE_ROLE_KEY="votre_clé"',
            '4. Redémarrez le serveur et réessayez',
          ],
        },
        { status: 400 }
      )
    }

    const supabaseAdmin = createSupabaseAdminClient(supabaseUrl!, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const supabase = await createClient()

    // Récupérer l'établissement
    const { data: etablissement } = await supabase
      .from('etablissements')
      .select('id')
      .limit(1)
      .single()

    if (!etablissement) {
      return NextResponse.json(
        { success: false, error: "Aucun établissement trouvé. Exécutez d'abord /api/setup" },
        { status: 400 }
      )
    }

    const usersToCreate = [
      { email: 'superadmin@orema.ga', password: 'SuperAdmin123!', pin: '0000', nom: 'Super', prenom: 'Admin', role: 'SUPER_ADMIN' as const },
      { email: 'admin@orema.ga', password: 'Admin123!', pin: '1234', nom: 'Admin', prenom: 'Super', role: 'ADMIN' as const },
    ]

    const results = []

    for (const userData of usersToCreate) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingAuthUser = existingUsers?.users?.find((u) => u.email === userData.email)

      let authUserId: string
      let authStatus: string

      if (existingAuthUser) {
        authUserId = existingAuthUser.id
        authStatus = 'already_exists'
      } else {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
        })

        if (authError) {
          results.push({ email: userData.email, authStatus: 'error', error: authError.message })
          continue
        }

        authUserId = authUser.user.id
        authStatus = 'created'
      }

      // Vérifier si l'utilisateur existe dans la table utilisateurs
      const { data: existingDbUser } = await supabase
        .from('utilisateurs')
        .select('id')
        .eq('email', userData.email)
        .single()

      let dbStatus: string
      if (!existingDbUser) {
        const hashedPassword = await hashPassword(userData.password)
        const hashedPin = await hashPin(userData.pin)

        await supabase.from('utilisateurs').insert({
          email: userData.email,
          password: hashedPassword,
          nom: userData.nom,
          prenom: userData.prenom,
          role: userData.role,
          pin_code: hashedPin,
          actif: true,
          etablissement_id: etablissement.id,
        })
        dbStatus = 'created'
      } else {
        dbStatus = 'already_exists'
      }

      results.push({ email: userData.email, authStatus, dbStatus })
    }

    // Log credentials only in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Setup Auth credentials:', usersToCreate.map((u) => ({ email: u.email, role: u.role, pin: '****' })))
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration Supabase Auth terminee. Consultez les logs serveur pour les credentials.',
    })
  } catch (error) {
    console.error('[Setup Auth] Erreur:', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la configuration auth' },
      { status: 500 }
    )
  }
}
