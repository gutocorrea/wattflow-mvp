# Configuração do Supabase Storage

Para que o upload de avatares funcione, você precisa configurar um Bucket no Supabase.

1.  Acesse o painel do seu projeto no [Supabase](https://supabase.com/dashboard).
2.  Vá para **Storage** no menu lateral.
3.  Clique em **New Bucket**.
4.  Nomeie o bucket como `avatars`.
5.  Marque a opção **Public bucket**.
6.  Clique em **Save**.

## Políticas de Acesso (RLS)

Para permitir que usuários façam upload, você precisa adicionar uma política.
No bucket `avatars`, vá em **Configuration** > **Policies** e adicione:

**Policy Name**: `Allow authenticated uploads`
**Allowed Operations**: `INSERT`, `SELECT`, `UPDATE`
**Target Roles**: `authenticated`

Ou use o SQL Editor:

```sql
-- Create the storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Set up access controls for storage.
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( auth.uid() = owner )
  with check ( bucket_id = 'avatars' );
```
