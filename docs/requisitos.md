# Requisitos e regras do Navora / HMC

## Regras de seguranca do Web Admin

### RS-01 — Funcionarios nunca sao excluidos, apenas desativados

- Usuarios da equipe (Recepcao e Administrador) nao podem ser apagados do sistema.
- Para retirar o acesso de alguem, o administrador **desativa** o usuario. A pessoa deixa de conseguir entrar no painel imediatamente, inclusive sessoes ja abertas.
- O historico continua salvo para consulta futura: quais visitantes o funcionario autorizou ou negou, quando, e quem desativou/reativou o acesso dele (com motivo).
- Um usuario desativado pode ser reativado com o mesmo perfil.
- Um administrador nao pode desativar a si mesmo, e o ultimo administrador ativo nao pode ser desativado.
- A regra e garantida em tres camadas: interface (nao existe botao de excluir), API (`DELETE /staff/:id` responde 405) e banco de dados (triggers recusam a exclusao).
- Escopo: vale para funcionarios. Pacientes seguem as regras proprias de cadastro/LGPD.
