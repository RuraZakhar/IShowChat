using IShowChat.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/[controller]")]
public class MessagesController : ControllerBase
{
    private readonly AppDbContext _context;
    public MessagesController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<IActionResult> GetMessages()
    {
        var messages = await _context.Messages.ToListAsync();
        return Ok(messages);
    }
}